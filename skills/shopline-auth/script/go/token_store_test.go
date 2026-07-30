package auth

import (
	"errors"
	"testing"
	"time"
)

// =============================================================================
// MemoryTokenStore tests
// =============================================================================

func TestMemoryTokenStore_SetAndGet(t *testing.T) {
	s := NewMemoryTokenStore()
	s.Set("key1", "value1", time.Minute)
	v, ok := s.Get("key1")
	if !ok || v != "value1" {
		t.Fatalf("expected (value1, true), got (%q, %v)", v, ok)
	}
}

func TestMemoryTokenStore_Miss(t *testing.T) {
	s := NewMemoryTokenStore()
	_, ok := s.Get("nonexistent")
	if ok {
		t.Fatal("expected cache miss for unknown key")
	}
}

func TestMemoryTokenStore_Expired(t *testing.T) {
	s := NewMemoryTokenStore()
	// Set with a TTL in the past by directly inserting an expired entry.
	s.mu.Lock()
	s.items["expired"] = cacheEntry{value: "v", expiry: time.Now().Add(-time.Second)}
	s.mu.Unlock()

	_, ok := s.Get("expired")
	if ok {
		t.Fatal("expected expired entry to be treated as a miss")
	}
}

func TestMemoryTokenStore_Delete(t *testing.T) {
	s := NewMemoryTokenStore()
	s.Set("k", "v", time.Minute)
	s.Delete("k")
	_, ok := s.Get("k")
	if ok {
		t.Fatal("expected key to be gone after Delete")
	}
}

func TestMemoryTokenStore_DeleteNonexistent(t *testing.T) {
	s := NewMemoryTokenStore()
	// Should not panic when deleting a key that does not exist.
	s.Delete("ghost")
}

// =============================================================================
// NewTokenStore tests
// =============================================================================

func TestNewTokenStore_ReturnsEmptyStore(t *testing.T) {
	store := NewTokenStore()
	if store == nil {
		t.Fatal("NewTokenStore must return a non-nil *TokenStore")
	}
	_, ok := store.Get("any")
	if ok {
		t.Fatal("new store should be empty")
	}
}

// =============================================================================
// GetAccessToken tests
// =============================================================================

func TestGetAccessToken_CacheHit(t *testing.T) {
	s := NewMemoryTokenStore()
	s.Set("tk:mystore:myapp", "cached-token", time.Minute)

	fetcher := func() (string, time.Time, error) {
		t.Fatal("fetcher must NOT be called on cache hit")
		return "", time.Time{}, nil
	}

	token, err := GetAccessToken("tk:mystore:myapp", s, fetcher)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token != "cached-token" {
		t.Fatalf("expected cached-token, got %q", token)
	}
}

func TestGetAccessToken_CacheMiss_SuccessfulFetch(t *testing.T) {
	s := NewMemoryTokenStore()
	expiry := time.Now().Add(time.Hour)
	fetchCalled := false

	fetcher := func() (string, time.Time, error) {
		fetchCalled = true
		return "fresh-token", expiry, nil
	}

	token, err := GetAccessToken("tk:mystore:myapp", s, fetcher)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !fetchCalled {
		t.Fatal("fetcher should have been called on cache miss")
	}
	if token != "fresh-token" {
		t.Fatalf("expected fresh-token, got %q", token)
	}
	// Token should now be cached.
	cached, ok := s.Get("tk:mystore:myapp")
	if !ok || cached != "fresh-token" {
		t.Fatal("fresh token should be stored in cache after fetch")
	}
}

func TestGetAccessToken_CacheMiss_FetchError(t *testing.T) {
	s := NewMemoryTokenStore()
	fetcher := func() (string, time.Time, error) {
		return "", time.Time{}, errors.New("upstream failure")
	}

	_, err := GetAccessToken("tk:mystore:myapp", s, fetcher)
	if err == nil {
		t.Fatal("expected error when fetch fails")
	}
}

func TestGetAccessToken_ExpiredTokenNotCached(t *testing.T) {
	s := NewMemoryTokenStore()
	// Fetcher returns an already-expired token.
	fetcher := func() (string, time.Time, error) {
		return "stale-token", time.Now().Add(-time.Minute), nil
	}

	token, err := GetAccessToken("key", s, fetcher)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token != "stale-token" {
		t.Fatalf("expected stale-token, got %q", token)
	}
	// An already-expired token must NOT be cached.
	_, ok := s.Get("key")
	if ok {
		t.Fatal("expired token must not be stored in cache")
	}
}

// =============================================================================
// ComputeTTL tests
// =============================================================================

func TestComputeTTL_FutureExpiry(t *testing.T) {
	expiry := time.Now().Add(100 * time.Second)
	ttl := ComputeTTL(expiry)
	// 90% of 100 s = 90 s; allow ±1 s for test timing.
	if ttl < 89*time.Second || ttl > 91*time.Second {
		t.Fatalf("expected ~90s TTL, got %v", ttl)
	}
}

func TestComputeTTL_AlreadyExpired(t *testing.T) {
	if ComputeTTL(time.Now().Add(-time.Second)) != 0 {
		t.Fatal("expired token must return TTL=0")
	}
}

// =============================================================================
// AccessTokenKey tests
// =============================================================================

func TestAccessTokenKey_Format(t *testing.T) {
	key := AccessTokenKey("my-store.myshopline.com", "appkey123")
	expected := "oauth:access_token:my-store.myshopline.com:appkey123"
	if key != expected {
		t.Fatalf("expected %q, got %q", expected, key)
	}
}

func TestAccessTokenKey_UniquePerStore(t *testing.T) {
	k1 := AccessTokenKey("store-a", "app1")
	k2 := AccessTokenKey("store-b", "app1")
	if k1 == k2 {
		t.Fatal("different stores must produce different cache keys")
	}
}
