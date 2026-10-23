/**
 * Small in-memory rate limiter.
 *
 * Good enough for a single-process demo / prototype deployment. On serverless
 * hosts each instance keeps its own counters, so for production use a shared
 * store (Redis, Upstash, Vercel KV) instead.
 */

const buckets = new Map();
const MAX_BUCKETS = 5000;

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) {
  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = `${clientKey(req)}|${req.method}|${req.baseUrl}${req.path}`;

    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;

    // Opportunistic cleanup so the map cannot grow forever.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
