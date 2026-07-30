package auth

import (
	"fmt"
	"sync"
	"time"
)

// =============================================================================
// TokenStorage — pluggable storage interface
// =============================================================================
//
// Implement this interface with any backend you prefer:
//
//   Option A — In-memory (development / single-process)
//     Use the built-in MemoryTokenStore below.
//
//   Option B — Redis
//     type RedisTokenStorage struct{ client *redis.Client }
//     func (r *RedisTokenStorage) Get(key string) (string, bool) {
//         val, err := r.client.Get(ctx, key).Result()
//         return val, err == nil && val != ""
//     }
//     func (r *RedisTokenStorage) Set(key, value string, ttl time.Duration) {
//         r.client.Set(ctx, key, value, ttl)
//     }
//     func (r *RedisTokenStorage) Delete(key string) { r.client.Del(ctx, key) }
//
//   Option C — Database (query refreshToken on every miss, write accessToken back)
//     type DBTokenStorage struct{ db *sql.DB }
//     func (d *DBTokenStorage) Get(key string) (string, bool) {
//         // SELECT access_token FROM store_app WHERE cache_key = ? AND expire_at > NOW()
//         ...
//     }
//     func (d *DBTokenStorage) Set(key, value string, ttl time.Duration) {
//         // UPDATE store_app SET access_token = ?, expire_at = ? WHERE cache_key = ?
//         ...
//     }
//     func (d *DBTokenStorage) Delete(key string) { ... }

// TokenStorage is the interface for reading and writing access tokens.
// Any backend (memory, Redis, database, …) can be used as long as it
// satisfies these three methods.
type TokenStorage interface {
	// Get returns the stored value and true if it exists and has not expired.
	// Returns ("", false) on a cache miss or expiry.
	Get(key string) (string, bool)

	// Set persists value under key for the duration of ttl.
	Set(key, value string, ttl time.Duration)

	// Delete removes the key immediately (e.g., on uninstall).
	Delete(key string)
}

// =============================================================================
// TokenFetcher — pluggable token-fetch strategy
// =============================================================================
//
// TokenFetcher is a function that obtains a fresh access token when the
// storage layer has no valid entry.
//
// You decide how to fetch:
//
//   Strategy A — Call SHOPLINE's refresh API directly (common):
//     fetcher := func() (string, time.Time, error) {
//         data, err := RefreshToken(handle, appKey, appSecret)
//         if err != nil { return "", time.Time{}, err }
//         expiry, _ := time.Parse(time.RFC3339, data.ExpireTime)
//         return data.AccessToken, expiry, nil
//     }
//
//   Strategy B — Read the refreshToken from your DB, then call SHOPLINE:
//     fetcher := func() (string, time.Time, error) {
//         row := db.QueryRow("SELECT refresh_token FROM store_app WHERE handle=?", handle)
//         ...
//         data, err := RefreshToken(handle, appKey, appSecret)
//         ...
//     }
//
//   Strategy C — Read the accessToken directly from your DB:
//     fetcher := func() (string, time.Time, error) {
//         row := db.QueryRow("SELECT access_token, expire_at FROM store_app WHERE ...")
//         ...
//         return accessToken, expireAt, nil
//     }

// TokenFetcher returns a fresh access token and its expiry time.
// It is called by GetAccessToken only when the storage layer has no valid entry.
type TokenFetcher func() (accessToken string, expiry time.Time, err error)

// =============================================================================
// GetAccessToken — storage-agnostic token retrieval
// =============================================================================

// GetAccessToken returns a valid access token using the provided storage and fetcher.
//
// Flow:
//  1. Check storage for an existing token (cache hit → return immediately).
//  2. On miss, call fetch() to obtain a fresh token.
//  3. Store the fresh token via storage.Set() with a safe TTL (90% of remaining lifetime).
//  4. Return the fresh token.
//
// The storage and fetch strategy are fully decoupled: swap either one independently.
func GetAccessToken(key string, storage TokenStorage, fetch TokenFetcher) (string, error) {
	// 1. Check storage first
	if cached, ok := storage.Get(key); ok {
		return cached, nil
	}

	// 2. Storage miss — fetch a fresh token
	accessToken, expiry, err := fetch()
	if err != nil {
		return "", fmt.Errorf("GetAccessToken fetch failed: %w", err)
	}

	// 3. Persist fresh token with a safe TTL
	if ttl := ComputeTTL(expiry); ttl > 0 {
		storage.Set(key, accessToken, ttl)
	}

	return accessToken, nil
}

// =============================================================================
// MemoryTokenStore — default in-memory implementation of TokenStorage
// =============================================================================

// cacheEntry holds a cached string value with its expiry time.
type cacheEntry struct {
	value  string
	expiry time.Time
}

// MemoryTokenStore is a thread-safe in-memory TokenStorage implementation.
// Suitable for development and single-process deployments.
// Replace with RedisTokenStorage or DBTokenStorage for production.
type MemoryTokenStore struct {
	mu    sync.RWMutex
	items map[string]cacheEntry
}

// NewMemoryTokenStore creates and returns an empty MemoryTokenStore.
func NewMemoryTokenStore() *MemoryTokenStore {
	return &MemoryTokenStore{items: make(map[string]cacheEntry)}
}

func (s *MemoryTokenStore) Get(key string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.items[key]
	if !ok || time.Now().After(e.expiry) {
		return "", false
	}
	return e.value, true
}

func (s *MemoryTokenStore) Set(key, value string, ttl time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[key] = cacheEntry{value: value, expiry: time.Now().Add(ttl)}
}

func (s *MemoryTokenStore) Delete(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, key)
}

// =============================================================================
// Helpers
// =============================================================================

// AccessTokenKey returns the recommended cache key for a store–app access token.
func AccessTokenKey(handle, appKey string) string {
	return fmt.Sprintf("oauth:access_token:%s:%s", handle, appKey)
}

// ComputeTTL calculates a safe cache TTL as 90% of the token's remaining lifetime.
// Returns 0 if the token has already expired.
func ComputeTTL(expiry time.Time) time.Duration {
	remaining := time.Until(expiry)
	if remaining <= 0 {
		return 0
	}
	return time.Duration(float64(remaining) * 0.9)
}

// =============================================================================
// TokenStore — convenience alias (keeps main.go and webhook.go signatures stable)
// =============================================================================

// TokenStore is a convenience alias for MemoryTokenStore.
//
// It exists so that code can use *TokenStore without importing a concrete type name.
// For production deployments replace MemoryTokenStore with a Redis or database
// implementation of the TokenStorage interface.
type TokenStore = MemoryTokenStore

// NewTokenStore returns a new empty in-memory TokenStore.
// For production use, replace with a Redis or database-backed implementation.
func NewTokenStore() *TokenStore {
	return NewMemoryTokenStore()
}
