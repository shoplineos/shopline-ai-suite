/**
 * homepage.js — GET /app/homepage handler (Node.js / Express)
 *
 * Entry point for the SHOPLINE OAuth authorization flow.
 * Determines whether to redirect the merchant to:
 *   (a) The app home page (already installed), or
 *   (b) The OAuth authorization page (not installed).
 */

const { verifySign, verifyTimestamp } = require('./sign');
const { generateSessionToken } = require('./session_token');

/**
 * Express route handler for GET /app/homepage.
 *
 * Decision tree:
 *  1. Verify HMAC-SHA256 query signature.
 *  2. Verify request timestamp (±10 min).
 *  3a. Already installed & scopes match → redirect to app home + sessionToken.
 *  3b. Not installed + lang present (embedded app) → redirect to app home with
 *      uninstalled=true so the frontend navigates to the OAuth page.
 *  3c. Not installed + lang absent (external app) → redirect directly to the
 *      SHOPLINE OAuth authorization page.
 *
 * @param {object} app       - Application config { appKey, appSecret, scopes, homeURL, callbackURL, appName, id }
 *                              homeURL: full URL of the frontend (e.g. "https://my-app.example.com")
 *                              callbackURL: full URL of the callback endpoint (e.g. "https://my-app.example.com/app/callback")
 * @param {object|null} storeApp - Installation record from DB { storeID, scopes, isInstall, refreshToken }
 *                                 Pass null if the store has never installed the app.
 * @returns {Function} Express middleware function (req, res) => void
 */
function homepageHandler(app, storeApp) {
  return (req, res) => {
    const q = req.query;
    const { appkey, handle, lang, timestamp, sign, host } = q;

    // Step 1: Verify query signature
    if (!verifySign(app.appSecret, q, sign)) {
      return res.status(401).json({ error: 'signature_verification_failed' });
    }

    // Step 2: Verify timestamp
    if (!verifyTimestamp(timestamp)) {
      return res.status(401).json({ error: 'timestamp_expired' });
    }

    // Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
    if (!isValidHandle(handle)) {
      return res.status(400).json({ error: 'invalid_handle_format' });
    }

    // Scope check uses strict equality: if required scopes have changed (e.g. after
    // a scope upgrade), re-authorization is triggered even for previously installed stores.
    const installed =
      storeApp &&
      storeApp.isInstall &&
      scopesEqual(storeApp.scopes, app.scopes);

    const callbackURL = app.callbackURL;

    if (installed) {
      // 3a. Already installed: generate session token and redirect to app home.
      const sessionToken = generateSessionToken({
        appKey: app.appKey,
        appSecret: app.appSecret,
        handle,
        storeID: storeApp.storeID,
        appName: app.appName,
      });
      const redirectURL = buildAppHomeURL(app.homeURL, app.appKey, handle, lang);
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 6 * 60 * 60 * 1000, // 6 hours, matching session JWT TTL
      });
      return res.redirect(302, redirectURL);
    }

    if (lang) {
      // 3b. Embedded app, not installed: tell frontend to navigate to OAuth page.
      const langCode = firstLang(lang);
      const redirectURL =
        `${app.homeURL}` +
        `?appkey=${encodeURIComponent(app.appKey)}` +
        `&handle=${encodeURIComponent(handle)}` +
        `&embedded=1` +
        `&lang=${encodeURIComponent(langCode)}` +
        `&uninstalled=true` +
        `&scope=${encodeURIComponent(app.scopes)}` +
        `&redirectUri=${encodeURIComponent(callbackURL)}` +
        (host ? `&host=${encodeURIComponent(host)}` : '');
      return res.redirect(302, redirectURL);
    }

    // 3c. External app, not installed: redirect to SHOPLINE OAuth page.
    const oauthURL =
      `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize` +
      `?appKey=${app.appKey}` +
      `&responseType=code` +
      `&scope=${encodeURIComponent(app.scopes)}` +
      `&redirectUri=${encodeURIComponent(callbackURL)}`;
    return res.redirect(302, oauthURL);
  };
}

/**
 * Returns true when the installed scope set exactly matches the required set.
 *
 * Strict equality is intentional: if the app's required scopes change (e.g. a new
 * permission is added), the store must re-authorize even if all old scopes are present.
 *
 * @param {string} installed  - Comma-separated scopes granted at install time
 * @param {string} required   - Comma-separated scopes required by the app
 * @returns {boolean}
 */
function scopesEqual(installed, required) {
  const parse = s => s.split(',').map(x => x.trim()).filter(Boolean).sort();
  const a = parse(installed);
  const b = parse(required);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Builds the redirect URL for the app home page.
 *
 * Rules:
 *   - lang present (embedded app) → embedded=1&isFromAppListPage=1&lang=<code>
 *   - lang absent  (external app) → embedded=0&isFromAppListPage=1
 *
 * @param {string} homeURL
 * @param {string} appKey
 * @param {string} handle
 * @param {string} lang    - Raw lang query param (may be comma-separated or empty)
 * @returns {string}
 */
function buildAppHomeURL(homeURL, appKey, handle, lang) {
  const base = `${homeURL}?appkey=${encodeURIComponent(appKey)}&handle=${encodeURIComponent(handle)}`;
  if (lang) {
    return base + `&embedded=1&isFromAppListPage=1&lang=${encodeURIComponent(firstLang(lang))}`;
  }
  return base + `&embedded=0&isFromAppListPage=1`;
}

/**
 * Returns the second language code when lang is comma-separated (e.g., "en,zh-CN"),
 * or the single value otherwise.
 *
 * @param {string} lang
 * @returns {string}
 */
function firstLang(lang) {
  const parts = lang.split(',');
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

/**
 * Validates that a handle contains only characters safe for subdomain construction.
 * Allowed: alphanumeric and hyphens; must start with an alphanumeric character.
 *
 * @param {string} handle
 * @returns {boolean}
 */
function isValidHandle(handle) {
  return typeof handle === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(handle);
}

module.exports = { homepageHandler, buildAppHomeURL, isValidHandle };
