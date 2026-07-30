"""
homepage.py — GET /app/homepage handler (Python / Flask)

Entry point for the SHOPLINE OAuth authorization flow.
"""

import re
from urllib.parse import quote

from flask import Flask, redirect, request, jsonify

# Validates that a handle contains only characters safe for subdomain construction.
# Allowed: alphanumeric and hyphens; must start with an alphanumeric character.
_HANDLE_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9-]*$")

from sign import verify_sign, verify_timestamp
from session_token import generate_session_token

app = Flask(__name__)


@app.route("/app/homepage")
def homepage():
    """
    Handle GET /app/homepage.

    Decision tree:
      1. Verify HMAC-SHA256 query signature.
      2. Verify request timestamp (±10 min).
      3a. Already installed & scopes match → redirect to app home + session_token.
      3b. Not installed + lang present (embedded app) → redirect to app home with uninstalled=true.
      3c. Not installed + lang absent (external app) → redirect to SHOPLINE OAuth page.

    In a real application, replace APP_CONFIG and load_store_app() with your own
    configuration and database lookups.
    """
    q = request.args
    handle    = (q.get("handle") or "").strip()
    lang      = q.get("lang", "")
    timestamp = q.get("timestamp", "")
    sign      = q.get("sign", "")

    # Load app configuration from environment / database
    app_cfg = load_app_config(q.get("appkey", ""))
    if app_cfg is None:
        return jsonify({"error": "app_not_found"}), 404

    # Step 1: Verify query signature
    if not verify_sign(app_cfg["app_secret"], dict(q), sign):
        return jsonify({"error": "signature_verification_failed"}), 401

    # Step 2: Verify timestamp
    if not verify_timestamp(timestamp):
        return jsonify({"error": "timestamp_expired"}), 401

    # Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
    if not _HANDLE_PATTERN.match(handle):
        return jsonify({"error": "invalid_handle_format"}), 400

    # Step 3: Check installation state.
    # Scope check uses strict equality: if required scopes have changed, re-authorization
    # is triggered even for previously installed stores.
    store_app = load_store_app(app_cfg["app_key"], handle)  # returns dict or None
    installed = (
        store_app is not None
        and store_app.get("is_install")
        and scopes_equal(store_app.get("scopes", ""), app_cfg["scopes"])
    )

    callback_url = app_cfg["callback_url"]

    if installed:
        # 3a. Already installed
        session_token = generate_session_token(
            app_key=app_cfg["app_key"],
            app_secret=app_cfg["app_secret"],
            handle=handle,
            store_id=store_app["store_id"],
            app_name=app_cfg["app_name"],
        )
        url = build_app_home_url(app_cfg["home_url"], app_cfg["app_key"], handle, lang)
        resp = redirect(url, code=302)
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

    if lang:
        # 3b. Embedded app, not installed: redirect to app home with uninstalled=true.
        # Frontend uses App Bridge toAdminPage(ADMIN_SECTION.OAUTH) to navigate.
        lang_code = first_lang(lang)
        url = (
            f"{app_cfg['home_url']}"
            f"?appkey={quote(app_cfg['app_key'])}"
            f"&handle={quote(handle)}"
            f"&embedded=1"
            f"&lang={quote(lang_code)}"
            f"&uninstalled=true"
            f"&scope={quote(app_cfg['scopes'])}"
            f"&redirectUri={quote(callback_url)}"
        )
        host = request.args.get("host", "")
        if host:
            url += f"&host={quote(host)}"
        return redirect(url, code=302)

    # 3c. External app, not installed
    oauth_url = (
        f"https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize"
        f"?appKey={app_cfg['app_key']}"
        f"&responseType=code"
        f"&scope={quote(app_cfg['scopes'])}"
        f"&redirectUri={quote(callback_url)}"
    )
    return redirect(oauth_url, code=302)


# ---------------------------------------------------------------------------
# Helpers — replace these stubs with your real implementations
# ---------------------------------------------------------------------------

def load_app_config(app_key: str) -> dict | None:
    """
    TODO: Load app configuration from your database or environment.
    Expected keys: app_key, app_secret, scopes, home_url, callback_url, app_name
      home_url: full URL of the frontend (e.g. "http://localhost:3000")
      callback_url: full URL of the backend callback endpoint (e.g. "https://xxx.trycloudflare.com/app/callback")
    """
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


def load_store_app(app_key: str, handle: str) -> dict | None:
    """
    TODO: Load the installation record for (app_key, handle) from your database.
    Expected keys: store_id, scopes, is_install, refresh_token
    """
    return None  # Return None → treated as not installed


def scopes_equal(installed: str, required: str) -> bool:
    """
    Return True when the installed scope set exactly matches the required set.

    Strict equality is intentional: if required scopes change (e.g. a new permission
    is added), the store must re-authorize even if all old scopes are still present.
    """
    parse = lambda s: sorted(x.strip() for x in s.split(",") if x.strip())
    return parse(installed) == parse(required)


def build_app_home_url(home_url: str, app_key: str, handle: str, lang: str) -> str:
    """
    Build the redirect URL for the app home page.

    Rules:
      - lang present (embedded app) → embedded=1&isFromAppListPage=1&lang=<code>
      - lang absent  (external app) → embedded=0&isFromAppListPage=1
    """
    base = f"{home_url}?appkey={quote(app_key)}&handle={quote(handle)}"
    if lang:
        return base + f"&embedded=1&isFromAppListPage=1&lang={quote(first_lang(lang))}"
    return base + "&embedded=0&isFromAppListPage=1"


def first_lang(lang: str) -> str:
    """Return the second language code if comma-separated, else the single value."""
    parts = lang.split(",", 1)
    return parts[1].strip() if len(parts) > 1 else parts[0].strip()
