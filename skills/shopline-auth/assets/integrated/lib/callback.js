/**
 * callback.js — GET /app/callback handler (Node.js / Express)
 *
 * Exchanges the OAuth authorization code for access + refresh tokens,
 * persists the installation record, and redirects the merchant to the app.
 */

const axios = require('axios');
const { verifySign, verifyTimestamp, generatePostSign } = require('./sign');
const { generateSessionToken } = require('./session_token');
const { accessTokenKey, computeTTL, set: cacheSet } = require('./token_store');
const { buildAppHomeURL } = require('./homepage');

/**
 * Express route handler for GET /app/callback.
 *
 * Steps:
 *  1. Verify HMAC-SHA256 query signature.
 *  2. Verify request timestamp (±10 min).
 *  3. Exchange the authorization code for tokens via SHOPLINE API.
 *  4. Extract storeID from the access token JWT payload.
 *  5. Persist the refresh token (database callback).
 *  6. Cache the access token (90% of remaining TTL).
 *  7. Generate a session JWT and redirect to the app home page.
 *
 * @param {object}   app                  - App config { appKey, appSecret, scopes, homeURL, appName, id }
 * @param {Function} persistRefreshToken  - async (handle, storeID, tokenData) => void  [save to DB]
 * @returns {Function} Express middleware function
 */
function callbackHandler(app, persistRefreshToken) {
  return async (req, res) => {
    const q = req.query;
    const { appkey, code, handle, lang, timestamp, sign } = q;

    // Step 1: Verify signature
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

    try {
      // Step 3: Exchange authorization code for tokens
      const tokenData = await exchangeToken(handle, app.appKey, app.appSecret, code);

      // Step 4: Extract storeID from the access token JWT payload
      const storeID = extractStoreID(tokenData.accessToken);

      // Step 5: Persist refresh token to database
      //
      // TODO: Replace with your real DB upsert.
      //   Fields required: storeID, handle, appKey, refreshToken, expireTime, scopes, isInstall=true
      if (persistRefreshToken) {
        await persistRefreshToken(handle, storeID, tokenData);
      }

      // Step 6: Cache access token (90% of remaining TTL)
      const ttlMs = computeTTL(tokenData.expireTime);
      if (ttlMs > 0) {
        cacheSet(accessTokenKey(handle, app.appKey), tokenData.accessToken, ttlMs);
      }

      // Step 7: Generate session token and redirect.
      // embedded/lang are inferred from the lang query param in the callback request.
      const sessionToken = generateSessionToken({
        appKey: app.appKey,
        appSecret: app.appSecret,
        handle,
        storeID,
        appName: app.appName,
      });

      const redirectURL = buildAppHomeURL(app.homeURL, app.appKey, handle, lang || '');
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 6 * 60 * 60 * 1000, // 6 hours, matching session JWT TTL
      });
      return res.redirect(302, redirectURL);
    } catch (err) {
      console.error('[callback] error:', err.message);
      return res.status(502).json({ error: 'oauth_code_exchange_failed' });
    }
  };
}

/**
 * Calls SHOPLINE's token create API to exchange an OAuth code for tokens.
 *
 * POST https://{handle}.myshopline.com/admin/oauth/token/create
 * Headers: appkey, timestamp, sign
 * Body:    {"code": "<authorization_code>"}
 *
 * @param {string} handle
 * @param {string} appKey
 * @param {string} appSecret
 * @param {string} code
 * @returns {Promise<object>} TokenData
 */
async function exchangeToken(handle, appKey, appSecret, code) {
  const body = JSON.stringify({ code });
  const timestamp = String(Date.now());
  const sign = generatePostSign(body, timestamp, appSecret);

  const { data: resp } = await axios.post(
    `https://${handle}.myshopline.com/admin/oauth/token/create`,
    { code },
    {
      headers: {
        'Content-Type': 'application/json',
        appkey: appKey,
        timestamp,
        sign,
      },
      timeout: 10000,
    }
  );

  if (resp.code !== 200 || !resp.data) {
    throw new Error(`ExchangeToken API error: code=${resp.code} message=${resp.message}`);
  }
  return resp.data;
}

/**
 * Decodes the SHOPLINE access token JWT payload (without signature verification)
 * to extract the numeric storeId claim.
 *
 * @param {string} accessToken - JWT string
 * @returns {number} Numeric store ID
 */
function extractStoreID(accessToken) {
  const parts = accessToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  const storeID = parseInt(payload.storeId, 10);
  if (isNaN(storeID)) throw new Error('storeId claim missing or invalid');
  return storeID;
}

/**
 * Calls SHOPLINE's token refresh API to obtain a new access token.
 *
 * POST https://{handle}.myshopline.com/admin/oauth/token/refresh
 * Body: (empty) — sign = HMAC-SHA256("" + timestamp, appSecret)
 *
 * @param {string} handle
 * @param {string} appKey
 * @param {string} appSecret
 * @returns {Promise<object>} TokenData
 */
async function refreshToken(handle, appKey, appSecret) {
  const timestamp = String(Date.now());
  const sign = generatePostSign('', timestamp, appSecret); // empty body

  const { data: resp } = await axios.post(
    `https://${handle}.myshopline.com/admin/oauth/token/refresh`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        appkey: appKey,
        timestamp,
        sign,
      },
      timeout: 10000,
    }
  );

  if (resp.code !== 200 || !resp.data) {
    throw new Error(`RefreshToken API error: code=${resp.code}`);
  }
  return resp.data;
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

module.exports = { callbackHandler, exchangeToken, refreshToken, extractStoreID, isValidHandle };
