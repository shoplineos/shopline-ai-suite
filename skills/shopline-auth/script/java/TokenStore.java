package com.shopline.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TokenStore — Pluggable token storage and retrieval (Java)
 *
 * Two independent extension points:
 *
 *   1. TokenStorage interface — where tokens are kept (memory / Redis / database / …)
 *   2. TokenFetcher interface  — how a fresh token is obtained on a storage miss
 *
 * Swap either one without touching the other.
 */
public class TokenStore {

    // =========================================================================
    // TokenStorage — pluggable storage interface
    // =========================================================================
    //
    // Implement this interface with any backend:
    //
    //   Option A — In-memory (default, development only):
    //     TokenStorage storage = new MemoryTokenStorage();
    //
    //   Option B — Redis (Lettuce / Jedis):
    //     TokenStorage storage = new TokenStorage() {
    //         public Optional<String> get(String key) {
    //             String val = redisTemplate.opsForValue().get(key);
    //             return Optional.ofNullable(val);
    //         }
    //         public void set(String key, String value, long ttlMs) {
    //             redisTemplate.opsForValue().set(key, value, ttlMs, TimeUnit.MILLISECONDS);
    //         }
    //         public void delete(String key) { redisTemplate.delete(key); }
    //     };
    //
    //   Option C — Database (query refreshToken on miss, write accessToken back):
    //     TokenStorage storage = new TokenStorage() {
    //         public Optional<String> get(String key) {
    //             return storeAppRepository.findAccessToken(key); // SELECT where expire_at > NOW()
    //         }
    //         public void set(String key, String value, long ttlMs) {
    //             storeAppRepository.updateAccessToken(key, value, Instant.now().plusMillis(ttlMs));
    //         }
    //         public void delete(String key) { storeAppRepository.clearToken(key); }
    //     };

    public interface TokenStorage {
        /**
         * Return the stored value if it exists and has not expired.
         * Return empty on miss or expiry.
         */
        Optional<String> get(String key);

        /**
         * Persist value under key for the given duration in milliseconds.
         */
        void set(String key, String value, long ttlMs);

        /**
         * Remove the key immediately (e.g., on uninstall).
         */
        void delete(String key);
    }

    // =========================================================================
    // TokenFetcher — how to obtain a fresh token on a storage miss
    // =========================================================================
    //
    // Strategy A — Call SHOPLINE refresh API (common):
    //   TokenFetcher fetcher = () -> {
    //       TokenData data = shoplineClient.refreshToken(handle, appKey, appSecret);
    //       return new FetchResult(data.getAccessToken(), Instant.parse(data.getExpireTime()));
    //   };
    //
    // Strategy B — Read refreshToken from DB, call SHOPLINE, write back:
    //   TokenFetcher fetcher = () -> {
    //       StoreApp row = storeAppRepository.findByHandle(handle, appKey);
    //       TokenData data = shoplineClient.refreshToken(handle, appKey, appSecret);
    //       storeAppRepository.updateToken(handle, appKey, data); // write back
    //       return new FetchResult(data.getAccessToken(), Instant.parse(data.getExpireTime()));
    //   };
    //
    // Strategy C — Read accessToken directly from DB (no external call):
    //   TokenFetcher fetcher = () -> {
    //       StoreApp row = storeAppRepository.findByHandle(handle, appKey);
    //       return new FetchResult(row.getAccessToken(), row.getExpireAt());
    //   };

    /** The result returned by a TokenFetcher. */
    public record FetchResult(String accessToken, Instant expiry) {}

    @FunctionalInterface
    public interface TokenFetcher {
        FetchResult fetch() throws Exception;
    }

    // =========================================================================
    // getAccessToken — storage-agnostic token retrieval
    // =========================================================================

    /**
     * Returns a valid access token using the provided storage and fetcher.
     *
     * Flow:
     *  1. Check storage for an existing token → return immediately on hit.
     *  2. On miss, call fetcher.fetch() to obtain a fresh token.
     *  3. Store the fresh token with a safe TTL (90% of remaining lifetime).
     *  4. Return the fresh token.
     *
     * @param key     Cache key, e.g. accessTokenKey(handle, appKey)
     * @param storage Any implementation of TokenStorage
     * @param fetcher Any implementation of TokenFetcher
     * @return Valid access token string
     * @throws Exception if the fetcher fails
     */
    public static String getAccessToken(String key, TokenStorage storage, TokenFetcher fetcher)
            throws Exception {
        // 1. Check storage
        Optional<String> cached = storage.get(key);
        if (cached.isPresent()) return cached.get();

        // 2. Miss — fetch fresh token
        FetchResult result = fetcher.fetch();
        if (result == null || result.accessToken() == null || result.accessToken().isEmpty()) {
            throw new RuntimeException("TokenFetcher returned an empty access token");
        }

        // 3. Store with safe TTL
        long ttlMs = computeTTL(result.expiry());
        if (ttlMs > 0) {
            storage.set(key, result.accessToken(), ttlMs);
        }

        return result.accessToken();
    }

    // =========================================================================
    // MemoryTokenStorage — default in-memory implementation
    // =========================================================================

    /** Internal cache entry. */
    private record CacheEntry(String value, Instant expiry) {
        boolean isExpired() { return Instant.now().isAfter(expiry); }
    }

    /**
     * Thread-safe in-memory TokenStorage implementation.
     * Suitable for development and single-process deployments.
     * Replace with a Redis or database implementation for production.
     */
    public static class MemoryTokenStorage implements TokenStorage {
        private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

        @Override
        public Optional<String> get(String key) {
            CacheEntry entry = cache.get(key);
            if (entry == null || entry.isExpired()) {
                cache.remove(key);
                return Optional.empty();
            }
            return Optional.of(entry.value());
        }

        @Override
        public void set(String key, String value, long ttlMs) {
            cache.put(key, new CacheEntry(value, Instant.now().plusMillis(ttlMs)));
        }

        @Override
        public void delete(String key) { cache.remove(key); }
    }

    // =========================================================================
    // Instance methods — delegate to an internal MemoryTokenStorage
    // =========================================================================
    //
    // WebhookController and CallbackController inject a TokenStore instance and
    // call set() / get() / delete() on it. These methods delegate to an internal
    // MemoryTokenStorage so the instance API works out of the box.

    private final MemoryTokenStorage storage = new MemoryTokenStorage();

    public Optional<String> get(String key) { return storage.get(key); }
    public void set(String key, String value, long ttlMs) { storage.set(key, value, ttlMs); }
    public void delete(String key) { storage.delete(key); }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Returns the recommended cache key for a store–app access token.
     */
    public static String accessTokenKey(String handle, String appKey) {
        return "oauth:access_token:" + handle + ":" + appKey;
    }

    /**
     * Computes a safe cache TTL as 90% of the token's remaining lifetime.
     *
     * @param expiry Token expiry as an Instant
     * @return TTL in milliseconds (0 if already expired)
     */
    public static long computeTTL(Instant expiry) {
        long remaining = expiry.toEpochMilli() - System.currentTimeMillis();
        if (remaining <= 0) return 0;
        return (long) (remaining * 0.9);
    }
}
