"""
token_store.py — Pluggable token storage and retrieval (Python)

Two independent extension points:

  1. TokenStorage (Protocol) — where tokens are kept (memory / Redis / database / …)
  2. TokenFetcher callable   — how a fresh token is obtained on a storage miss

Swap either one without touching the other.
"""

import time
from datetime import datetime, timezone
from threading import Lock
from typing import Callable, Optional, Protocol, Tuple


# =============================================================================
# TokenStorage — pluggable storage protocol
# =============================================================================
#
# Any class implementing get / set / delete works — no inheritance required.
#
# Option A — In-memory (default, development only):
#   storage = MemoryTokenStore()
#
# Option B — Redis (redis-py):
#   class RedisTokenStore:
#       def __init__(self, client): self._r = client
#       def get(self, key): return self._r.get(key)  # returns bytes or None
#       def set(self, key, value, ttl_ms):
#           self._r.set(key, value, px=ttl_ms)
#       def delete(self, key): self._r.delete(key)
#
# Option C — Database (read refreshToken on miss, write accessToken back):
#   class DBTokenStore:
#       def get(self, key):
#           row = db.execute(
#               "SELECT access_token FROM store_app "
#               "WHERE cache_key=? AND expire_at>NOW()", [key]
#           ).fetchone()
#           return row["access_token"] if row else None
#       def set(self, key, value, ttl_ms):
#           expire_at = datetime.now() + timedelta(milliseconds=ttl_ms)
#           db.execute("UPDATE store_app SET access_token=?, expire_at=? "
#                      "WHERE cache_key=?", [value, expire_at, key])
#       def delete(self, key): ...


class TokenStorage(Protocol):
    """Protocol for token storage backends. Any matching class works."""

    def get(self, key: str) -> Optional[str]:
        """Return the stored value, or None on miss / expiry."""
        ...

    def set(self, key: str, value: str, ttl_ms: int) -> None:
        """Persist value under key for ttl_ms milliseconds."""
        ...

    def delete(self, key: str) -> None:
        """Remove the key immediately."""
        ...


# =============================================================================
# TokenFetcher — how to obtain a fresh token on a storage miss
# =============================================================================
#
# A TokenFetcher is a callable () -> (access_token: str, expire_time: str)
#
# Strategy A — Call SHOPLINE refresh API (common):
#   def fetcher():
#       data = refresh_token(handle, app_key, app_secret)
#       return data["accessToken"], data["expireTime"]
#
# Strategy B — Read refreshToken from DB, call SHOPLINE, write back:
#   def fetcher():
#       store_app = db.get_store_app(handle, app_key)
#       data = shopline_refresh(handle, app_key, app_secret)
#       db.update_token(handle, app_key, data)   # write back
#       return data["accessToken"], data["expireTime"]
#
# Strategy C — Read accessToken directly from DB (no external call):
#   def fetcher():
#       row = db.execute(
#           "SELECT access_token, expire_at FROM store_app WHERE handle=? AND app_key=?",
#           [handle, app_key]
#       ).fetchone()
#       return row["access_token"], row["expire_at"].isoformat()

TokenFetcher = Callable[[], Tuple[str, str]]  # () -> (access_token, expire_time_iso)


# =============================================================================
# get_access_token — storage-agnostic token retrieval
# =============================================================================

def get_access_token(key: str, storage: TokenStorage, fetch: TokenFetcher) -> str:
    """
    Return a valid access token using the provided storage and fetcher.

    Flow:
      1. Check storage for an existing token → return immediately on hit.
      2. On miss, call fetch() to obtain a fresh token.
      3. Store the fresh token with a safe TTL (90% of remaining lifetime).
      4. Return the fresh token.

    Args:
        key:     Cache key, e.g. access_token_key(handle, app_key).
        storage: Any object satisfying the TokenStorage protocol.
        fetch:   Callable returning (access_token, expire_time_iso_string).

    Returns:
        A valid access token string.

    Raises:
        RuntimeError: If fetch() fails or returns an empty token.
    """
    # 1. Check storage
    cached = storage.get(key)
    if cached:
        return cached

    # 2. Miss — fetch fresh token
    access_token, expire_time = fetch()
    if not access_token:
        raise RuntimeError("TokenFetcher returned an empty access token")

    # 3. Store with safe TTL
    ttl_ms = compute_ttl(expire_time)
    if ttl_ms > 0:
        storage.set(key, access_token, ttl_ms)

    return access_token


# =============================================================================
# MemoryTokenStore — default in-memory implementation
# =============================================================================

class MemoryTokenStore:
    """
    Thread-safe in-memory TokenStorage implementation.
    Suitable for development and single-process deployments.
    Replace with RedisTokenStore or DBTokenStore for production.
    """

    def __init__(self) -> None:
        self._cache: dict[str, dict] = {}
        self._lock = Lock()

    def get(self, key: str) -> Optional[str]:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None or time.monotonic() > entry["expiry"]:
                self._cache.pop(key, None)
                return None
            return entry["value"]

    def set(self, key: str, value: str, ttl_ms: int) -> None:
        with self._lock:
            self._cache[key] = {
                "value":  value,
                "expiry": time.monotonic() + (ttl_ms / 1000.0),
            }

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)


# =============================================================================
# Helpers
# =============================================================================

# Convenience alias so that other modules can import TokenStore directly.
TokenStore = MemoryTokenStore


def access_token_key(handle: str, app_key: str) -> str:
    """Return the recommended cache key for a store–app access token."""
    return f"oauth:access_token:{handle}:{app_key}"


def compute_ttl(expire_time: str) -> int:
    """
    Compute a safe cache TTL as 90% of the token's remaining lifetime.

    Args:
        expire_time: ISO 8601 expiry string (e.g., "2026-04-03T12:00:00.000Z").

    Returns:
        TTL in milliseconds (0 if already expired or unparseable).
    """
    try:
        expiry = datetime.fromisoformat(expire_time.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return 0
    remaining_ms = int((expiry - datetime.now(timezone.utc)).total_seconds() * 1000)
    if remaining_ms <= 0:
        return 0
    return int(remaining_ms * 0.9)
