"""
callback.py — GET /app/callback handler (Python / Flask)

Exchanges the OAuth code for tokens, persists the installation, and
redirects the merchant to the app home page.
"""

import base64
import json
import logging
import re
import time

import requests

logger = logging.getLogger(__name__)

# Validates that a handle contains only characters safe for subdomain construction.
# Allowed: alphanumeric and hyphens; must start with an alphanumeric character.
_HANDLE_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9-]*$")
from flask import Flask, redirect, request, jsonify

from sign import verify_sign, verify_timestamp, generate_post_sign
from session_token import generate_session_token
from token_store import TokenStore, access_token_key, compute_ttl
from homepage import build_app_home_url

app = Flask(__name__)
store = TokenStore()


@app.route("/app/callback")
def callback():
    """
    Handle GET /app/callback.

    Steps:
      1. Verify HMAC-SHA256 query signature.
      2. Verify request timestamp (±10 min).
      3. Exchange the authorization code for tokens.
      4. Extract store_id from the access token JWT payload.
      5. Persist the refresh token to the database.
      6. Cache the access token (90% of remaining TTL).
      7. Generate a session JWT and redirect to the app home page.
    """
    q         = request.args
    handle    = (q.get("handle") or "").strip()
    code      = q.get("code", "")
    lang      = q.get("lang", "")
    timestamp = q.get("timestamp", "")
    sign      = q.get("sign", "")

    # Load app configuration
    app_cfg = load_app_config(q.get("appkey", ""))
    if app_cfg is None:
        return jsonify({"error": "app_not_found"}), 404

    # Step 1: Verify signature
    if not verify_sign(app_cfg["app_secret"], dict(q), sign):
        return jsonify({"error": "signature_verification_failed"}), 401

    # Step 2: Verify timestamp
    if not verify_timestamp(timestamp):
        return jsonify({"error": "timestamp_expired"}), 401

    # Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
    if not _HANDLE_PATTERN.match(handle):
        return jsonify({"error": "invalid_handle_format"}), 400

    # Step 3: Exchange code for tokens
    token_data = exchange_token(handle, app_cfg["app_key"], app_cfg["app_secret"], code)
    if token_data is None:
        return jsonify({"error": "oauth_code_exchange_failed"}), 502

    # Step 4: Extract store_id from access token JWT payload
    store_id = extract_store_id(token_data["accessToken"])
    if store_id == 0:
        return jsonify({"error": "store_id_resolution_failed"}), 500

    # Step 5: Persist refresh token to database
    #
    # TODO: Replace the stub below with your real DB upsert.
    #   Required fields: store_id, handle, app_key, refresh_token, expire_time, scopes, is_install=True
    persist_refresh_token(handle, store_id, app_cfg["app_key"], token_data)

    # Step 6: Cache access token (90% of remaining TTL)
    ttl_ms = compute_ttl(token_data["expireTime"])
    if ttl_ms > 0:
        store.set(access_token_key(handle, app_cfg["app_key"]), token_data["accessToken"], ttl_ms)

    # Step 7: Generate session token and redirect.
    # embedded/lang are inferred from the lang query param in the callback request.
    session_token = generate_session_token(
        app_key=app_cfg["app_key"],
        app_secret=app_cfg["app_secret"],
        handle=handle,
        store_id=store_id,
        app_name=app_cfg["app_name"],
    )
    redirect_url = build_app_home_url(app_cfg["home_url"], app_cfg["app_key"], handle, lang)
    resp = redirect(redirect_url, code=302)
    resp.set_cookie(
        "session_token",
        session_token,
        max_age=6 * 60 * 60,  # 6 hours, matching session JWT TTL
        path="/",
        secure=True,
        httponly=True,
        samesite="Lax",
    )
    return resp


def exchange_token(handle: str, app_key: str, app_secret: str, code: str) -> dict | None:
    """
    Call SHOPLINE's token create API to exchange an OAuth code for tokens.

    POST https://{handle}.myshopline.com/admin/oauth/token/create
    Headers: appkey, timestamp, sign
    Body:    {"code": "<authorization_code>"}
    """
    body_str  = json.dumps({"code": code}, separators=(",", ":"))
    timestamp = str(int(time.time() * 1000))
    sign      = generate_post_sign(body_str, timestamp, app_secret)

    try:
        resp = requests.post(
            f"https://{handle}.myshopline.com/admin/oauth/token/create",
            data=body_str,
            headers={
                "Content-Type": "application/json",
                "appkey":        app_key,
                "timestamp":     timestamp,
                "sign":          sign,
            },
            timeout=10,
        )
    except requests.exceptions.RequestException as e:
        logger.error("[callback] HTTP request failed: %s", e)
        return None

    try:
        data = resp.json()
    except ValueError as e:
        logger.error("[callback] JSON decode failed: %s", e)
        return None

    if data.get("code") != 200 or not data.get("data"):
        return None
    return data["data"]


def extract_store_id(access_token: str) -> int:
    """
    Decode the SHOPLINE access token JWT payload (without signature verification)
    to extract the numeric storeId claim.
    """
    parts = access_token.split(".")
    if len(parts) != 3:
        return 0
    # Add padding and decode base64url
    padded = parts[1] + "=" * (-len(parts[1]) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(padded))
        return int(payload.get("storeId", 0))
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# Stubs — replace with real implementations
# ---------------------------------------------------------------------------

def load_app_config(app_key: str) -> dict | None:
    """TODO: Load app config from DB/environment. See homepage.py for expected keys."""
    import os
    if app_key != os.environ.get("APP_KEY"):
        return None
    backend_url = os.environ.get("BACKEND_URL", "")
    return {
        "app_key":      os.environ["APP_KEY"],
        "app_secret":   os.environ["APP_SECRET"],
        "scopes":       os.environ.get("APP_SCOPES", ""),
        "home_url":     os.environ.get("FRONTEND_URL", ""),
        "callback_url": backend_url + "/app/callback",
        "app_name":     os.environ.get("APP_NAME", ""),
    }


def persist_refresh_token(handle: str, store_id: int, app_key: str, token_data: dict) -> None:
    """
    TODO: Upsert the refresh token into your database.
    Fields: handle, store_id, app_key, refresh_token, expire_time, scopes, is_install=True
    """
    pass  # Replace with your DB logic
