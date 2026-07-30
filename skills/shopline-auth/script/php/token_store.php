<?php
/**
 * token_store.php — Pluggable token storage and retrieval (PHP)
 *
 * Two independent extension points:
 *
 *   1. TokenStorageInterface — where tokens are kept (memory / Redis / database / …)
 *   2. TokenFetcher callable  — how a fresh token is obtained on a storage miss
 *
 * Swap either one without touching the other.
 */

// =============================================================================
// TokenStorageInterface
// =============================================================================

interface TokenStorageInterface
{
    /**
     * Return the stored value if it exists and has not expired.
     * Return null on miss or expiry.
     */
    public function get(string $key): ?string;

    /**
     * Persist $value under $key for $ttlMs milliseconds.
     */
    public function set(string $key, string $value, int $ttlMs): void;

    /**
     * Remove the key immediately (e.g., on uninstall).
     */
    public function delete(string $key): void;
}

// =============================================================================
// getAccessToken — storage-agnostic token retrieval
// =============================================================================
//
// TokenFetcher is a callable () => ['accessToken' => string, 'expireTime' => string]
//
// Strategy A — Call SHOPLINE refresh API (common):
//   $fetcher = function() use ($handle, $appKey, $appSecret) {
//       return exchangeRefreshToken($handle, $appKey, $appSecret); // returns TokenData array
//   };
//
// Strategy B — Read refreshToken from DB, call SHOPLINE, write result back:
//   $fetcher = function() use ($handle, $appKey, $appSecret, $db) {
//       $row = $db->fetchStoreApp($handle, $appKey);
//       $data = callShoplineRefresh($handle, $appKey, $appSecret);
//       $db->updateToken($handle, $appKey, $data);
//       return $data;
//   };
//
// Strategy C — Read accessToken directly from DB (no external call):
//   $fetcher = function() use ($handle, $appKey, $db) {
//       $row = $db->query(
//           'SELECT access_token, expire_at FROM store_app WHERE handle=? AND app_key=?',
//           [$handle, $appKey]
//       );
//       return ['accessToken' => $row['access_token'], 'expireTime' => $row['expire_at']];
//   };

/**
 * Returns a valid access token using the provided storage and fetcher.
 *
 * Flow:
 *  1. Check storage for an existing token → return immediately on hit.
 *  2. On miss, call $fetcher() to obtain a fresh token.
 *  3. Store the fresh token with a safe TTL (90% of remaining lifetime).
 *  4. Return the fresh token.
 *
 * @param string                 $key     Cache key, e.g. accessTokenKey($handle, $appKey)
 * @param TokenStorageInterface  $storage Any implementation of TokenStorageInterface
 * @param callable               $fetcher () => ['accessToken' => string, 'expireTime' => string]
 * @return string Valid access token
 * @throws RuntimeException on fetch failure
 */
function getAccessToken(string $key, TokenStorageInterface $storage, callable $fetcher): string
{
    // 1. Check storage
    $cached = $storage->get($key);
    if ($cached !== null) {
        return $cached;
    }

    // 2. Miss — fetch fresh token
    $tokenData = $fetcher();
    if (empty($tokenData['accessToken'])) {
        throw new RuntimeException('TokenFetcher returned empty accessToken');
    }

    // 3. Store with safe TTL
    $ttlMs = computeTTL($tokenData['expireTime'] ?? '');
    if ($ttlMs > 0) {
        $storage->set($key, $tokenData['accessToken'], $ttlMs);
    }

    return $tokenData['accessToken'];
}

// =============================================================================
// MemoryTokenStore — default in-memory implementation
// =============================================================================

/**
 * Simple in-memory TokenStorage. Suitable for development and single-process
 * environments. Replace with RedisTokenStore or DBTokenStore for production.
 */
class MemoryTokenStore implements TokenStorageInterface
{
    /** @var array<string, array{value: string, expiry: float}> */
    private array $cache = [];

    public function get(string $key): ?string
    {
        $entry = $this->cache[$key] ?? null;
        if ($entry === null || microtime(true) > $entry['expiry']) {
            unset($this->cache[$key]);
            return null;
        }
        return $entry['value'];
    }

    public function set(string $key, string $value, int $ttlMs): void
    {
        $this->cache[$key] = [
            'value'  => $value,
            'expiry' => microtime(true) + ($ttlMs / 1000.0),
        ];
    }

    public function delete(string $key): void
    {
        unset($this->cache[$key]);
    }
}

// =============================================================================
// TokenStore — static facade used by webhook.php / callback.php
// =============================================================================

/**
 * Convenience static facade backed by a singleton MemoryTokenStore.
 * webhook.php and callback.php call TokenStore::set(), ::get(), ::delete(),
 * ::accessTokenKey(), and ::computeTTL() as static methods.
 */
class TokenStore
{
    private static ?MemoryTokenStore $instance = null;

    private static function store(): MemoryTokenStore
    {
        if (self::$instance === null) {
            self::$instance = new MemoryTokenStore();
        }
        return self::$instance;
    }

    public static function get(string $key): ?string
    {
        return self::store()->get($key);
    }

    public static function set(string $key, string $value, int $ttlMs): void
    {
        self::store()->set($key, $value, $ttlMs);
    }

    public static function delete(string $key): void
    {
        self::store()->delete($key);
    }

    public static function accessTokenKey(string $handle, string $appKey): string
    {
        return accessTokenKey($handle, $appKey);
    }

    public static function computeTTL(string $expireTime): int
    {
        return computeTTL($expireTime);
    }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Returns the recommended cache key for a store–app access token.
 */
function accessTokenKey(string $handle, string $appKey): string
{
    return "oauth:access_token:{$handle}:{$appKey}";
}

/**
 * Computes a safe cache TTL as 90% of the token's remaining lifetime.
 *
 * @param string $expireTime ISO 8601 expiry string
 * @return int TTL in milliseconds (0 if already expired)
 */
function computeTTL(string $expireTime): int
{
    if (empty($expireTime)) return 0;
    $expiryMs = (int) (strtotime($expireTime) * 1000);
    $nowMs    = (int) round(microtime(true) * 1000);
    $remaining = $expiryMs - $nowMs;
    if ($remaining <= 0) return 0;
    return (int) ($remaining * 0.9);
}
