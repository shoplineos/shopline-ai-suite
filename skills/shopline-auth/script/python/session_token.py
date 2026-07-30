"""
session_token.py — Session JWT generation (Python)

Creates HS256 JWTs used by the frontend to authenticate subsequent API calls.
Requires the PyJWT package: pip install PyJWT
"""

import base64
import json
import time

import jwt  # PyJWT

# Session token validity duration (6 hours in seconds).
SESSION_EXPIRY_SECONDS = 6 * 3600


def generate_session_token(
    app_key: str,
    app_secret: str,
    handle: str,
    store_id: int,
    app_name: str,
) -> str:
    """
    Generate a signed HS256 session JWT.

    Claims:
      - handle   : store domain handle
      - storeId  : numeric SHOPLINE store identifier
      - appName  : application name
      - aud      : appKey (used by middleware to look up appSecret)
      - iat / exp: issued-at and expiry (6 h)

    Signing key: base64.b64encode(appSecret) — matches the Go/Java convention.

    Args:
        app_key:    Application key (stored in the "aud" claim).
        app_secret: Application secret (used to derive the signing key).
        handle:     Store domain handle.
        store_id:   Numeric SHOPLINE store identifier.
        app_name:   Application display name.

    Returns:
        Signed JWT string.
    """
    now = int(time.time())
    signing_key = base64.b64encode(app_secret.encode("utf-8")).decode("utf-8")

    payload = {
        "handle": handle,
        "storeId": store_id,
        "appName": app_name,
        "aud": app_key,
        "iat": now,
        "exp": now + SESSION_EXPIRY_SECONDS,
    }

    return jwt.encode(payload, signing_key, algorithm="HS256")


def parse_token(token: str, app_secret: str) -> dict:
    """
    Parse and verify a session JWT.

    Use this as the second step in auth middleware after decode_payload has
    identified the app_key and the app_secret has been loaded from your database.

    Args:
        token:      JWT string from the Authorization header.
        app_secret: Application secret used to derive the signing key.

    Returns:
        Decoded claims dict: { handle, storeId, appName, aud, iat, exp }

    Raises:
        jwt.InvalidTokenError: If the signature is invalid or the token has expired.
    """
    signing_key = base64.b64encode(app_secret.encode("utf-8")).decode("utf-8")
    return jwt.decode(token, signing_key, algorithms=["HS256"], options={"verify_aud": False})


def decode_payload(token: str) -> dict:
    """
    Decode the JWT payload without verifying the signature.

    Use this as the first step in auth middleware to extract the aud (app_key) claim
    before loading the app_secret from your database for full verification.

    Args:
        token: JWT string.

    Returns:
        Raw payload as a dict.

    Raises:
        ValueError: If the token format is invalid.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError(f"Invalid JWT: expected 3 segments, got {len(parts)}")
    padded = parts[1] + "=" * (-len(parts[1]) % 4)
    raw = base64.urlsafe_b64decode(padded)
    return json.loads(raw)
