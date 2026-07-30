/**
 * routes/auth.js — SHOPLINE OAuth route definitions (integrated architecture)
 *
 * Mounts the three required authorization endpoints:
 *   GET  /app/homepage                 — signature check + install detection + redirect
 *   GET  /app/callback                 — code exchange + session token generation
 *   POST /webhook/appstore/callback    — install/uninstall lifecycle events
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');

const { homepageHandler }  = require('../lib/homepage');
const { callbackHandler }  = require('../lib/callback');
const { webhookHandler }   = require('../lib/webhook');

const router = express.Router();

// Rate limiters — prevent abuse on public endpoints (600 req/min per IP)
const appLimiter = rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true });
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true });

// ---------------------------------------------------------------------------
// App & store configuration — replace with real DB lookups in production
// ---------------------------------------------------------------------------

/**
 * Loads app configuration from environment variables.
 * TODO: Replace with a real database query using the appKey from req.query.
 */
function loadApp(_appKey) {
  const homeURL = process.env.APP_HOME_URL;  // full URL, e.g. "https://my-app.example.com"
  return {
    appKey:      process.env.APP_KEY,
    appSecret:   process.env.APP_SECRET,
    scopes:      process.env.APP_SCOPES,
    homeURL:     homeURL,
    callbackURL: homeURL + '/app/callback',
    appName:     process.env.APP_NAME,
  };
}

/**
 * Loads the store installation record from your database.
 * TODO: Replace with a real DB query using (appKey, handle).
 * Return null if the store has never installed the app.
 */
async function loadStoreApp(_appKey, _handle) {
  return null; // null → treated as not installed
}

/**
 * Persists the refresh token and installation record to your database.
 * TODO: Replace with your real DB upsert.
 */
async function persistRefreshToken(handle, storeID, tokenData) {
  // TODO: upsert into store_app table
  // Fields: handle, storeID, appKey, refreshToken, expireTime, scopes, isInstall: true
  console.log(`[auth] persist token for handle=${handle} storeID=${storeID}`);
}

/**
 * Marks the app as uninstalled in your database.
 * TODO: Replace with your real DB update.
 */
async function markUninstalled(handle, appKey) {
  // TODO: set isInstall = false for (handle, appKey)
  console.log(`[auth] uninstall handle=${handle} appKey=${appKey}`);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /app/homepage
 * Verifies signature + timestamp, then redirects based on install state.
 */
router.get('/app/homepage', appLimiter, async (req, res) => {
  const app      = loadApp(req.query.appkey);
  const storeApp = await loadStoreApp(app.appKey, req.query.handle);
  return homepageHandler(app, storeApp)(req, res);
});

/**
 * GET /app/callback
 * Receives OAuth code, exchanges for tokens, stores refresh token, redirects.
 */
router.get('/app/callback', appLimiter, async (req, res) => {
  const app = loadApp(req.query.appkey);
  return callbackHandler(app, persistRefreshToken)(req, res);
});

/**
 * POST /webhook/appstore/callback
 * Handles SHOPLINE app lifecycle events (uninstall).
 */
router.post('/webhook/appstore/callback', webhookLimiter, webhookHandler(process.env.APP_SECRET, markUninstalled));

module.exports = router;
