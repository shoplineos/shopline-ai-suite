"""
webhook.py — POST /webhook/appstore/callback handler (Python / Flask)

Handles SHOPLINE appstore lifecycle events (install / uninstall).
"""

import os

from flask import Flask, request, jsonify

from token_store import TokenStore, access_token_key
from sign import verify_webhook_sign

app = Flask(__name__)
store = TokenStore()

APP_SECRET = os.environ.get("SHOPLINE_APP_SECRET", "")

OPERATE_UNINSTALL = "uninstall"


@app.route("/webhook/appstore/callback", methods=["POST"])
def webhook():
    """
    Handle POST /webhook/appstore/callback.

    Steps:
      1. Verify the webhook signature using X-Shopline-Hmac-Sha256 header.
      2. Parse the request body JSON.
      3. Dispatch based on the "operate" field.
      4. On uninstall: delete cached access token and call mark_uninstalled().
    """
    # Step 1: Verify webhook signature
    raw_body = request.get_data(as_text=True)
    received_sign = request.headers.get("X-Shopline-Hmac-Sha256", "")
    if not verify_webhook_sign(APP_SECRET, raw_body, received_sign):
        return jsonify({"error": "invalid_signature"}), 401

    event = request.get_json(silent=True)
    if not event or not event.get("operate"):
        return jsonify({"error": "invalid_webhook_body"}), 400

    operate = event["operate"]
    if operate == OPERATE_UNINSTALL:
        _handle_uninstall(event)
    # Other operate values: acknowledge and ignore

    return "", 200


def _handle_uninstall(event: dict) -> None:
    """
    Process the uninstall event.

    Actions:
      1. Delete the cached access token.
      2. Call mark_uninstalled() to update the database.
    """
    handle  = event.get("handle", "")
    app_key = event.get("appkey", "")

    # Step 1: Remove cached access token
    store.delete(access_token_key(handle, app_key))

    # Step 2: Update database install status to False
    #
    # TODO: Replace the stub below with your real database update.
    #   Set is_install = False for (handle, app_key) in your store_app table.
    mark_uninstalled(handle, app_key)


def mark_uninstalled(handle: str, app_key: str) -> None:
    """
    TODO: Update the store_app record in your database.
    Set is_install = False where handle = handle AND app_key = app_key.
    """
    pass  # Replace with your DB logic
