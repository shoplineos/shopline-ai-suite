/**
 * session_token.js — Session JWT generation (Node.js)
 *
 * Creates HS256 JWTs used by the frontend to authenticate subsequent API calls.
 * The signing key is base64(appSecret) to match the SHOPLINE backend convention.
 */

const jwt = require('jsonwebtoken');

/** Session token validity duration (6 hours). */
const SESSION_EXPIRY_SECONDS = 6 * 60 * 60;

/**
 * Generates a signed HS256 session JWT.
 *
 * Claims included:
 *   - handle   : store domain handle
 *   - storeId  : numeric SHOPLINE store identifier
 *   - appName  : application name
 *   - aud      : appKey (used by middleware to look up appSecret)
 *   - iat / exp: issued-at and expiry (6 h)
 *
 * Signing key: Buffer.from(appSecret).toString('base64')
 *
 * @param {object} params
 * @param {string} params.appKey
 * @param {string} params.appSecret
 * @param {string} params.handle
 * @param {number} params.storeID
 * @param {string} params.appName
 * @returns {string} Signed JWT string
 */
function generateSessionToken({ appKey, appSecret, handle, storeID, appName }) {
  const signingKey = Buffer.from(appSecret).toString('base64');
  return jwt.sign(
    {
      handle,
      storeId: storeID,
      appName,
    },
    signingKey,
    {
      algorithm: 'HS256',
      audience: appKey,
      expiresIn: SESSION_EXPIRY_SECONDS,
    }
  );
}

/**
 * Parses and verifies a session JWT.
 *
 * Use this as the second step in AuthMiddleware after decodePayload has
 * identified the appKey and the appSecret has been loaded from your database.
 *
 * @param {string} token      - JWT string from the Authorization header
 * @param {string} appSecret  - Application secret used to derive the signing key
 * @returns {object} Decoded claims: { handle, storeId, appName, aud, iat, exp }
 * @throws {Error} If the signature is invalid or the token has expired
 */
function parseToken(token, appSecret) {
  const signingKey = Buffer.from(appSecret).toString('base64');
  return jwt.verify(token, signingKey, { algorithms: ['HS256'] });
}

/**
 * Decodes the JWT payload without verifying the signature.
 *
 * Use this as the first step in AuthMiddleware to extract the aud (appKey) claim
 * before loading the appSecret from your database for full verification.
 *
 * @param {string} token - JWT string
 * @returns {object} Raw payload object
 * @throws {Error} If the token format is invalid
 */
function decodePayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error(`Invalid JWT: expected 3 segments, got ${parts.length}`);
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

module.exports = { generateSessionToken, parseToken, decodePayload };
