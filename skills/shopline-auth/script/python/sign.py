"""
sign.py — SHOPLINE OAuth signature utilities (Python)

Implements HMAC-SHA256 signing for GET (homepage/callback) and
POST (token create/refresh) requests, plus timestamp validation.
"""

import hashlib
import hmac
import math
import time
from urllib.parse import parse_qs

# Maximum allowed time drift between request timestamp and server time (ms).
MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000  # 10 minutes


def verify_sign(app_secret: str, query: dict, received_sign: str) -> bool:
    """
    Verify the HMAC-SHA256 signature of a SHOPLINE GET request.

    Algorithm:
      1. Remove the "sign" key from the query parameters.
      2. Sort remaining keys alphabetically (ascending).
      3. Concatenate as "key1=value1&key2=value2...".
      4. Compute HMAC-SHA256(payload, app_secret) → hex string.
      5. Compare with received_sign using hmac.compare_digest (constant-time).

    Args:
        app_secret:    Application secret key.
        query:         Dict of query parameters (e.g., request.args or dict(request.GET)).
        received_sign: The "sign" value from the request.

    Returns:
        True if the signature matches, False otherwise.
    """
    # Build a copy without the "sign" key
    params = {k: v for k, v in query.items() if k != "sign"}

    # Sort keys alphabetically and build payload
    payload = "&".join(f"{k}={params[k]}" for k in sorted(params))

    expected_sign = hmac.new(
        app_secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(expected_sign, received_sign)


def generate_post_sign(body: str, timestamp: str, app_secret: str) -> str:
    """
    Generate the HMAC-SHA256 signature for a SHOPLINE POST request.

    Used when calling SHOPLINE's OAuth token APIs (create / refresh).
    source = body + timestamp, signed with app_secret.

    Args:
        body:       JSON-serialized request body string ('' for token refresh).
        timestamp:  Unix millisecond timestamp string.
        app_secret: Application secret key.

    Returns:
        Hex-encoded HMAC-SHA256 signature string.
    """
    source = body + timestamp
    return hmac.new(
        app_secret.encode("utf-8"),
        source.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_webhook_sign(app_secret: str, body: str, received_sign: str) -> bool:
    """
    Verify the HMAC-SHA256 signature of a SHOPLINE webhook POST request.

    SHOPLINE sends the signature in the "X-Shopline-Hmac-Sha256" HTTP header.
    The signature is computed as HMAC-SHA256(requestBody, appSecret), hex-encoded.

    Args:
        app_secret:    Application secret key.
        body:          Raw request body string.
        received_sign: Value of X-Shopline-Hmac-Sha256 header.

    Returns:
        True if the signature matches, False otherwise.
    """
    if not received_sign:
        return False
    expected_sign = hmac.new(
        app_secret.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_sign, received_sign)


def verify_timestamp(timestamp: str) -> bool:
    """
    Check whether the given Unix-millisecond timestamp string is within
    the allowed drift window (±10 min) of the current server time.

    Args:
        timestamp: Unix timestamp in milliseconds (as a string).

    Returns:
        True if within the allowed window, False otherwise.
    """
    try:
        ts = int(timestamp)
    except (ValueError, TypeError):
        return False
    now_ms = int(time.time() * 1000)
    return math.fabs(now_ms - ts) <= MAX_TIMESTAMP_DRIFT_MS
