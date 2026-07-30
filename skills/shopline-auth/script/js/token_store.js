/**
 * token_store.js — Pluggable token storage and retrieval (Node.js)
 *
 * Two independent extension points:
 *
 *   1. TokenStorage — where tokens are kept (memory / Redis / database / …)
 *   2. TokenFetcher — how a fresh token is obtained on a cache miss
 *
 * Swap either one without touching the other.
 */

// =============================================================================
// TokenStorage interface (duck-typed in JS)
// =============================================================================
//
// Any object with { get(key), set(key, value, ttlMs), delete(key) } works.
//
// Option A — In-memory (default, development only):
//   const storage = new MemoryTokenStore();
//
// Option B — Redis (ioredis):
//   const storage = {
//     async get(key) {
//       const val = await redis.get(key);
//       return val || null;
//     },
//     async set(key, value, ttlMs) {
//       await redis.set(key, value, 'PX', ttlMs);
//     },
//     async delete(key) { await redis.del(key); },
//   };
//
// Option C — Database (query refreshToken on miss, write accessToken back):
//   const storage = {
//     async get(key) {
//       const row = await db.query(
//         'SELECT access_token FROM store_app WHERE cache_key=? AND expire_at>NOW()', [key]
//       );
//       return row?.access_token || null;
//     },
//     async set(key, value, ttlMs) {
//       const expireAt = new Date(Date.now() + ttlMs);
//       await db.query(
//         'UPDATE store_app SET access_token=?, expire_at=? WHERE cache_key=?',
//         [value, expireAt, key]
//       );
//     },
//     async delete(key) { ... },
//   };

// =============================================================================
// TokenFetcher — how to obtain a fresh token on a storage miss
// =============================================================================
//
// A TokenFetcher is an async function () => { accessToken, expireTime }
//
// Strategy A — Call SHOPLINE refresh API (common):
//   const fetcher = async () => {
//     const data = await refreshToken(handle, appKey, appSecret);
//     return { accessToken: data.accessToken, expireTime: data.expireTime };
//   };
//
// Strategy B — Read refreshToken from DB first, then call SHOPLINE:
//   const fetcher = async () => {
//     const { refreshToken } = await db.findStoreApp(handle, appKey);
//     const data = await shoplineRefresh(handle, appKey, appSecret);
//     await db.updateToken(handle, appKey, data); // write back to DB
//     return data;
//   };
//
// Strategy C — Read accessToken directly from DB (no external call):
//   const fetcher = async () => {
//     const row = await db.query(
//       'SELECT access_token, expire_at FROM store_app WHERE handle=? AND app_key=?',
//       [handle, appKey]
//     );
//     return { accessToken: row.access_token, expireTime: row.expire_at };
//   };

// =============================================================================
// getAccessToken — storage-agnostic token retrieval
// =============================================================================

/**
 * Returns a valid access token using the provided storage and fetcher.
 *
 * Flow:
 *  1. Check storage for an existing token → return immediately on hit.
 *  2. On miss, call fetcher() to obtain a fresh token.
 *  3. Store the fresh token with a safe TTL (90% of remaining lifetime).
 *  4. Return the fresh token.
 *
 * @param {string}   key     - Cache key, e.g. accessTokenKey(handle, appKey)
 * @param {object}   storage - Any object implementing { get, set, delete }
 * @param {Function} fetcher - async () => { accessToken: string, expireTime: string }
 * @returns {Promise<string>} Valid access token
 */
async function getAccessToken(key, storage, fetcher) {
  // 1. Check storage
  const cached = await storage.get(key);
  if (cached) return cached;

  // 2. Miss — fetch fresh token
  // ⚠ In multi-instance deployments, acquire a distributed lock
  //   `oauth:refresh_lock:{handle}:{appKey}` here to prevent concurrent
  //   refreshes from overwhelming the SHOPLINE token API. See protocol.md §4.
  const { accessToken, expireTime } = await fetcher();

  // 3. Store with safe TTL
  const ttlMs = computeTTL(expireTime);
  if (ttlMs > 0) {
    await storage.set(key, accessToken, ttlMs);
  }

  return accessToken;
}

// =============================================================================
// MemoryTokenStore — default in-memory implementation
// =============================================================================
//
// Concurrency note:
//   MemoryTokenStore uses a plain Map, which is safe under Node.js's single-threaded
//   event loop. However, getAccessToken does NOT implement a distributed lock. In
//   multi-instance deployments, concurrent cache misses will cause multiple instances
//   to call the fetcher simultaneously, potentially exhausting the SHOPLINE token API
//   rate limit or invalidating each other's tokens.
//
//   For multi-instance deployments, you MUST acquire a distributed lock
//   `oauth:refresh_lock:{handle}:{appKey}` before calling the fetcher.
//   See protocol.md §4.
//

class MemoryTokenStore {
  constructor() {
    /** @type {Map<string, {value: string, expiry: number}>} */
    this._cache = new Map();
  }

  /** @returns {string|null} */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this._cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /** @param {number} ttlMs */
  set(key, value, ttlMs) {
    this._cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  delete(key) {
    this._cache.delete(key);
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Returns the recommended cache key for a store–app access token.
 * @param {string} handle
 * @param {string} appKey
 * @returns {string}
 */
function accessTokenKey(handle, appKey) {
  return `oauth:access_token:${handle}:${appKey}`;
}

/**
 * Computes a safe cache TTL as 90% of the token's remaining lifetime.
 * @param {string} expireTime - ISO 8601 string (e.g., "2026-04-03T12:00:00.000Z")
 * @returns {number} TTL in milliseconds (0 if already expired)
 */
function computeTTL(expireTime) {
  const remaining = new Date(expireTime).getTime() - Date.now();
  if (remaining <= 0) return 0;
  return Math.floor(remaining * 0.9);
}

const _store = new MemoryTokenStore();
function set(key, value, ttlMs) { _store.set(key, value, ttlMs); }
function del(key) { _store.delete(key); }
function get(key) { return _store.get(key); }

module.exports = { getAccessToken, MemoryTokenStore, accessTokenKey, computeTTL, set, del, get };
