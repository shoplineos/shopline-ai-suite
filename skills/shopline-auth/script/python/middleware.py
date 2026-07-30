"""
middleware.py — JWT session auth middleware (Python / Flask)

Validates the session JWT passed by the frontend in the Authorization header
and makes the login context (handle, store_id, app_key, ...) available to handlers.

Authentication steps (matching protocol.md §3):
  1. Extract the Bearer token from the Authorization header.
  2. Decode payload without verification to read the aud (app_key) claim.
  3. Load the app via app_loader to obtain the app_secret.
  4. Fully verify the JWT signature and expiry via parse_token.
  5. Verify the store–app installation via install_checker.
  6. Inject LoginInfo into Flask's g (or return it directly).

Usage — decorator style:

    from middleware import require_auth

    @app.route("/api/orders")
    @require_auth(app_loader=load_app, install_checker=check_install)
    def orders(login_info):
        # login_info: { handle, store_id, app_key, app_name }
        return jsonify({"handle": login_info["handle"]})

    def load_app(app_key: str) -> dict | None:
        # SELECT * FROM app WHERE app_key = ?
        ...

    def check_install(handle: str, app_key: str) -> dict | None:
        # SELECT store_id, is_install FROM store_app WHERE handle = ? AND app_key = ?
        ...
"""

import functools
from typing import Callable

from flask import request, jsonify, g

from session_token import parse_token, decode_payload


def require_auth(
    app_loader: Callable[[str], dict | None],
    install_checker: Callable[[str, int], dict | None],
):
    """
    Flask route decorator that validates the session JWT.

    Args:
        app_loader:
            Callable[[app_key: str], dict | None]
            Load the app record (keys: app_key, app_secret, app_name) by appKey.
            Return None if not found.

        install_checker:
            Callable[[handle: str, app_key: str], dict | None]
            Load the store_app record (keys: store_id, is_install) by handle+appKey.
            Return None if not found.

    Returns:
        A Flask route decorator that injects `login_info` as the first positional argument.
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            login_info, err = _authenticate(app_loader, install_checker)
            if err:
                return jsonify({"success": False, "code": "AUTH_FAILED", "message": err}), 401
            g.login_info = login_info
            return fn(login_info, *args, **kwargs)
        return wrapper
    return decorator


def get_login_info() -> dict | None:
    """
    Returns the authenticated login context from Flask's g.
    Call this inside a handler protected by @require_auth.

    Returns:
        dict with keys: handle, store_id, app_key, app_name
        None if the middleware was not applied.
    """
    return getattr(g, "login_info", None)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _authenticate(app_loader, install_checker) -> tuple[dict | None, str | None]:
    """Performs the full JWT authentication flow. Returns (login_info, error_message)."""

    # Step 1: Extract token from Authorization header or session_token cookie
    auth_header = request.headers.get("Authorization", "")
    token_string = ""
    if auth_header:
        token_string = auth_header.removeprefix("Bearer ").strip()
    else:
        token_string = request.cookies.get("session_token", "")
    if not token_string:
        return None, "missing Authorization header or session_token cookie"

    # Step 2: Decode payload without verification to extract app_key (aud claim)
    try:
        payload = decode_payload(token_string)
    except Exception:
        return None, "invalid token format"

    app_key = _get_app_key(payload)
    if not app_key:
        return None, "token missing aud claim"

    # Step 3: Load app to obtain app_secret
    try:
        app = app_loader(app_key)
    except Exception as e:
        import logging
        logging.exception("[auth] failed to load app")
        return None, "failed to load app"
    if not app:
        return None, "app not found"

    # Step 4: Full signature + expiry verification
    try:
        claims = parse_token(token_string, app["app_secret"])
    except Exception:
        return None, "invalid or expired token"

    handle = claims.get("handle", "")

    # Step 5: Verify store–app installation
    try:
        store_app = install_checker(handle, app["app_key"])
    except Exception as e:
        import logging
        logging.exception("[auth] failed to check installation")
        return None, "failed to check installation"
    if not store_app or not store_app.get("is_install") or not store_app.get("store_id"):
        return None, "app not installed"

    return {
        "handle":   handle,
        "store_id": store_app["store_id"],
        "app_key":  app["app_key"],
        "app_name": app.get("app_name", ""),
    }, None


def _get_app_key(payload: dict) -> str | None:
    """Extracts the app_key from the aud claim. aud can be a string or a list."""
    aud = payload.get("aud")
    if isinstance(aud, str):
        return aud
    if isinstance(aud, list) and aud:
        return str(aud[0])
    return None
