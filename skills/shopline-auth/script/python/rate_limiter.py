"""
rate_limiter.py — Per-IP rate limiter (Python / Flask)

Provides a simple in-memory fixed-window rate limiter.
Default: 600 requests per minute per IP.

Usage (Flask decorator):

    from rate_limiter import rate_limit

    @app.route("/app/homepage")
    @rate_limit(max_requests=600, window_seconds=60)
    def homepage():
        ...
"""

import time
import threading
from functools import wraps
from flask import request, jsonify


class RateLimiter:
    """In-memory fixed-window rate limiter keyed by client IP."""

    def __init__(self, max_requests: int = 600, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._visitors: dict[str, tuple[int, float]] = {}  # ip -> (count, window_end)
        self._lock = threading.Lock()

    def allow(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            entry = self._visitors.get(ip)
            if entry is None or now >= entry[1]:
                self._visitors[ip] = (1, now + self.window)
                return True
            count, window_end = entry
            if count >= self.max_requests:
                return False
            self._visitors[ip] = (count + 1, window_end)
            return True


def _client_ip() -> str:
    """Extract client IP from X-Forwarded-For, X-Real-Ip, or remote_addr."""
    xff = request.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.headers.get("X-Real-Ip", "")
    if xri:
        return xri
    return request.remote_addr or ""


# Default limiter instance: 600 req/min per IP
_default_limiter = RateLimiter(max_requests=600, window_seconds=60)


def rate_limit(max_requests: int = 600, window_seconds: int = 60):
    """
    Flask route decorator that enforces per-IP rate limiting.

    Returns HTTP 429 with Retry-After header when limit is exceeded.
    """
    limiter = RateLimiter(max_requests, window_seconds)

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = _client_ip()
            if not limiter.allow(ip):
                resp = jsonify({"error": "rate_limit_exceeded"})
                resp.status_code = 429
                resp.headers["Retry-After"] = str(window_seconds)
                return resp
            return f(*args, **kwargs)
        return wrapper
    return decorator
