/**
 * Express application for BloodBridge AI.
 *
 * Exports the configured app WITHOUT starting a listener so it can be
 * hosted anywhere: locally via src/index.js, or as a serverless function
 * (e.g. Vercel api/index.js) where calling app.listen() is not allowed.
 */
const express = require('express');
const cors = require('cors');
const { seedData } = require('./seeds/seedInMemory');
const db = require('./store');

const donorRoutes = require('./routes/donors');
const hospitalRoutes = require('./routes/hospitals');
const requestRoutes = require('./routes/requests');
const matchRoutes = require('./routes/match');
const predictionRoutes = require('./routes/predictions');
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const verificationRoutes = require('./routes/verification');
const replacementDonorRoutes = require('./routes/replacementDonors');

const app = express();

// Behind Vercel's proxy, trust one hop so req.ip (used by the rate limiter)
// is the real client IP instead of the proxy address.
if (process.env.VERCEL) app.set('trust proxy', 1);

// Do not advertise the framework.
app.disable('x-powered-by');

// CORS: same-origin by default. Cross-origin clients must be explicitly
// allow-listed through ALLOWED_ORIGINS (comma-separated).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '100kb' }));

// Basic security headers for API responses.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/replacement-donors', replacementDonorRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);

// Health check — no internal counts, just liveness.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// JSON 404 for unknown API routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Central error handler — never leak stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[api] Unhandled error:', err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error.' : err.message });
});

// Restore persisted data if available; otherwise seed fresh demo data.
// This keeps data intact across server restarts (important during demos).
// On serverless hosts the filesystem is read-only, so load() finds nothing
// and fresh demo data is seeded on each cold start instead.
if (db.load()) {
  console.log('Restored persisted data from disk.');
} else {
  console.log('No persisted data found. Seeding fresh demo data...');
  seedData();
}

// On a long-running server (local dev / demo machine), snapshot data to disk
// every few seconds and on shutdown. On serverless hosts (VERCEL is set)
// the filesystem is read-only, so skip it — writes would only fail there.
if (!process.env.VERCEL) {
  setInterval(() => db.persist(), 5000).unref();
  process.on('SIGINT', () => { db.persist(); process.exit(0); });
  process.on('SIGTERM', () => { db.persist(); process.exit(0); });
}

module.exports = app;
