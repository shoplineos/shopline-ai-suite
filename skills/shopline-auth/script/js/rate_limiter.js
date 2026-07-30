/**
 * rate_limiter.js — Per-IP rate limiter middleware (Node.js / Express)
 *
 * Provides an in-memory fixed-window rate limiter.
 * Default: 600 requests per minute per IP.
 *
 * Usage:
 *   const { createRateLimiter } = require('./rate_limiter');
 *   const limiter = createRateLimiter({ max: 600, windowMs: 60000 });
 *   router.get('/app/homepage', limiter, homepageHandler(app, storeApp));
 */

/**
 * Creates an Express middleware that enforces per-IP rate limiting.
 *
 * @param {object} opts
 * @param {number} [opts.max=600]        - Max requests per window per IP
 * @param {number} [opts.windowMs=60000] - Window duration in milliseconds
 * @returns {Function} Express middleware
 */
function createRateLimiter({ max = 600, windowMs = 60000 } = {}) {
  const visitors = new Map(); // ip -> { count, windowEnd }

  // Periodically clean up expired entries.
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of visitors) {
      if (now >= entry.windowEnd) visitors.delete(ip);
    }
  }, windowMs * 2).unref();

  return (req, res, next) => {
    const ip = clientIP(req);
    const now = Date.now();
    let entry = visitors.get(ip);

    if (!entry || now >= entry.windowEnd) {
      visitors.set(ip, { count: 1, windowEnd: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'rate_limit_exceeded' });
    }

    entry.count++;
    return next();
  };
}

/**
 * Extracts client IP from X-Forwarded-For, X-Real-Ip, or socket address.
 * @param {object} req - Express request
 * @returns {string}
 */
function clientIP(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  const xri = req.headers['x-real-ip'];
  if (xri) return xri;
  return req.socket?.remoteAddress || '';
}

module.exports = { createRateLimiter };
