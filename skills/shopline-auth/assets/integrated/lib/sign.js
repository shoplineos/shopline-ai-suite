/**
 * sign.js — SHOPLINE OAuth signature utilities (Node.js)
 *
 * Implements HMAC-SHA256 signing for both GET (homepage/callback) and
 * POST (token create/refresh) requests, plus timestamp validation.
 */

const crypto = require('crypto');

/**
 * Maximum allowed time drift between request timestamp and server time (ms).
 * Requests with a timestamp outside this window will be rejected.
 */
const MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Verifies the HMAC-SHA256 signature of a SHOPLINE GET request.
 *
 * Algorithm:
 *  1. Remove the "sign" key from the query parameters.
 *  2. Sort remaining keys alphabetically (ascending).
 *  3. Concatenate as "key1=value1&key2=value2...".
 *  4. Compute HMAC-SHA256(payload, appSecret) → hex string.
 *  5. Compare with the received sign using a timing-safe comparison.
 *
 * @param {string} appSecret  - Application secret key
 * @param {object} query      - Parsed query parameter object (e.g., req.query)
 * @param {string} receivedSign - The "sign" value from the query string
 * @returns {boolean}
 */
function verifySign(appSecret, query, receivedSign) {
  // Build a copy without the "sign" key
  const params = Object.fromEntries(
    Object.entries(query).filter(([k]) => k !== 'sign')
  );

  // Sort keys alphabetically and concatenate as k=v&k=v
  const payload = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const expectedSign = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSign, 'hex'),
      Buffer.from(receivedSign, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generates the HMAC-SHA256 signature for a SHOPLINE POST request.
 *
 * Used when calling SHOPLINE's OAuth token APIs (create / refresh).
 * source = requestBodyString + timestamp, signed with appSecret.
 *
 * @param {string} body      - JSON-serialized request body string ('' for refresh)
 * @param {string} timestamp - Unix millisecond timestamp string
 * @param {string} appSecret - Application secret key
 * @returns {string} Hex-encoded HMAC-SHA256 signature
 */
function generatePostSign(body, timestamp, appSecret) {
  const source = body + timestamp;
  return crypto.createHmac('sha256', appSecret).update(source).digest('hex');
}

/**
 * Checks whether the given Unix-millisecond timestamp string is within
 * the allowed drift window (±10 min) of the current server time.
 *
 * @param {string|number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean}
 */
function verifyTimestamp(timestamp) {
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= MAX_TIMESTAMP_DRIFT_MS;
}

/**
 * Verifies the HMAC-SHA256 signature of a SHOPLINE webhook POST request.
 *
 * SHOPLINE sends the signature in the "X-Shopline-Hmac-Sha256" HTTP header.
 * The signature is computed as HMAC-SHA256(requestBody, appSecret), hex-encoded.
 *
 * @param {string} appSecret - Application secret key
 * @param {string} body      - Raw request body string
 * @param {string} receivedSign - Value of X-Shopline-Hmac-Sha256 header
 * @returns {boolean}
 */
function verifyWebhookSign(appSecret, body, receivedSign) {
  if (!receivedSign) return false;

  const expectedSign = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSign, 'hex'),
      Buffer.from(receivedSign, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = { verifySign, generatePostSign, verifyTimestamp, verifyWebhookSign };
