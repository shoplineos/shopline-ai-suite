/**
 * middleware.js — JWT session auth middleware (Node.js / Express)
 *
 * Validates the session JWT passed by the frontend in the Authorization header
 * and injects login context (handle, storeID, appKey, ...) into req.loginInfo.
 *
 * Authentication steps (matching protocol.md §3):
 *  1. Extract the Bearer token from the Authorization header.
 *  2. Decode payload without verification to read the aud (appKey) claim.
 *  3. Load the app via appLoader to obtain the appSecret.
 *  4. Fully verify the JWT signature and expiry via parseToken.
 *  5. Verify the store–app installation via installChecker.
 *  6. Attach LoginInfo to req.loginInfo; call next().
 *
 * Usage:
 *
 *   const { authMiddleware } = require('./middleware');
 *
 *   const loader  = async (appKey) => db.query('SELECT * FROM app WHERE app_key = ?', [appKey]);
 *   const checker = async (handle, appKey) => db.query(
 *     'SELECT store_id, is_install FROM store_app WHERE handle = ? AND app_key = ?', [handle, appKey]
 *   );
 *
 *   // Protect a single route
 *   app.get('/api/orders', authMiddleware(loader, checker), ordersHandler);
 *
 *   // Protect a route group
 *   app.use('/api', authMiddleware(loader, checker));
 */

const { parseToken, decodePayload } = require('./session_token');

/**
 * Returns an Express middleware that validates the session JWT.
 *
 * @param {Function} appLoader
 *   async (appKey: string) => { appKey, appSecret, appName } | null
 *   Load the app record by appKey from your database.
 *
 * @param {Function} installChecker
 *   async (handle: string, appKey: string) => { storeId: number, isInstall: boolean } | null
 *   Verify the store–app installation and return the storeId.
 *
 * @returns {Function} Express middleware (req, res, next) => void
 */
function authMiddleware(appLoader, installChecker) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      let tokenString = '';
      if (authHeader) {
        tokenString = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      } else if (req.cookies && req.cookies.session_token) {
        tokenString = req.cookies.session_token;
      }
      if (!tokenString) {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: 'missing Authorization header or session_token cookie' });
      }

      // Step 2: Decode payload without verification to extract appKey (aud claim)
      let payload;
      try {
        payload = decodePayload(tokenString);
      } catch {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: 'invalid token format' });
      }

      const appKey = getAppKey(payload);
      if (!appKey) {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: 'token missing aud claim' });
      }

      // Step 3: Load app to obtain appSecret
      const app = await appLoader(appKey);
      if (!app) {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: 'app not found' });
      }

      // Step 4: Full signature + expiry verification
      let claims;
      try {
        claims = parseToken(tokenString, app.appSecret);
      } catch {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: 'invalid or expired token' });
      }

      // Step 5: Verify store–app installation
      const storeApp = await installChecker(claims.handle, app.appKey);
      if (!storeApp || !storeApp.isInstall || !storeApp.storeId) {
        return res.status(401).json({ success: false, code: 'AUTH_FAILED', message: `app not installed for store ${claims.handle}` });
      }

      // Step 6: Inject login context
      req.loginInfo = {
        handle:  claims.handle,
        storeID: storeApp.storeId,
        appKey:  app.appKey,
        appName: app.appName,
      };

      next();
    } catch (err) {
      console.error('[auth] internal error:', err);
      res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'internal server error' });
    }
  };
}

/**
 * Extracts the appKey from a decoded JWT payload's aud claim.
 * aud can be a string or an array (jsonwebtoken uses arrays for audience).
 *
 * @param {object} payload
 * @returns {string|null}
 */
function getAppKey(payload) {
  const aud = payload.aud;
  if (typeof aud === 'string') return aud;
  if (Array.isArray(aud) && aud.length > 0) return aud[0];
  return null;
}

module.exports = { authMiddleware };
