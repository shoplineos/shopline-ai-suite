/**
 * app.js — Integrated frontend/backend app entry point (Node.js / Express)
 *
 * Architecture: All-in-one — frontend static assets and backend OAuth routes
 * are served by the same Express process.
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in your credentials.
 *      IMPORTANT: APP_HOME_URL must include the protocol (https://)
 *      e.g. APP_HOME_URL=https://my-app.example.com (NOT my-app.example.com)
 *   2. npm install
 *   3. npm run build   (bundles src/shopline-auth.js → public/js/shopline-auth.js via esbuild)
 *   4. node app.js     (or use "npm start" which runs build + start)
 */

require('dotenv').config();
const express   = require('express');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const authRouter      = require('./routes/auth');
const { authMiddleware } = require('./lib/middleware');

const PORT = process.env.PORT || 3000;
const app  = express();

// Trust proxy — required when behind a reverse proxy (Cloudflare, nginx, etc.)
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// when the proxy sets the X-Forwarded-For header.
app.set('trust proxy', 1);

// Rate limiting
app.use('/app/', rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true }));
app.use('/webhook/', rateLimit({ windowMs: 60_000, max: 100 }));

// Security headers
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// Parse JSON request bodies (required for webhook handler)
app.use(express.json());

// Mount the SHOPLINE OAuth routes (public — no auth required)
app.use('/', authRouter);

// Serve frontend static files from the /public directory
// In production, replace this with your CDN or SSR framework's static handler.
app.use(express.static(path.join(__dirname, 'public')));

// Health check — used by load balancers and SHOPLINE webhook verification
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------------------------
// Protected API routes — session JWT required
// ---------------------------------------------------------------------------

/**
 * App & install loaders for the auth middleware.
 * TODO: Replace with real database queries in production.
 */
function loadApp(appKey) {
  return {
    appKey:    process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    appName:   process.env.APP_NAME,
  };
}

async function checkInstall(handle, appKey) {
  // TODO: Replace with a real DB query.
  // Return { storeId, isInstall: true } if installed, null otherwise.
  return { storeId: 0, isInstall: true };
}

app.use('/api', authMiddleware(loadApp, checkInstall));

/**
 * GET /api/me — Example protected endpoint.
 * Returns the authenticated session context injected by authMiddleware.
 */
app.get('/api/me', (req, res) => {
  res.json({ success: true, data: req.loginInfo });
});

// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[shopline-auth] integrated server listening on port ${PORT}`);
});

module.exports = app;
