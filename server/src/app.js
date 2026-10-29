/**
 * Express application for BloodBridge AI.
 *
 * Exports the configured app WITHOUT starting a listener so it can be
 * hosted anywhere: locally via src/index.js, or as a serverless function
 * (e.g. Vercel api/index.js) where calling app.listen() is not allowed.
 */
const express = require('express');
const cors = require('cors');
const { seedData, shouldSeedDemoData } = require('./seeds/seedInMemory');
const { enrichHospitals } = require('./hospitalDirectory');
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
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  next();
});

// Initialize storage once per process (or per serverless cold start). The
// first request waits for MongoDB/JSON data to load so routes always see data.
let initialization = null;
function initialize() {
  if (!initialization) {
    initialization = (async () => {
      const { mode, hadData } = await db.init();

      if (!hadData) {
        const includeDemo = shouldSeedDemoData();
        console.log(
          `No data found (${mode}). Seeding verified facility directory`
          + `${includeDemo ? ' + local demo data' : ''}...`
        );
        seedData({ includeDemo });
        await db.persist({ force: true });
      } else {
        // Existing snapshots may predate the hospital address/helpline fields.
        if (enrichHospitals(db.hospitals.data)) await db.persist();
        console.log(`Loaded data from ${mode}.`);
      }
    })().catch(err => {
      initialization = null;
      throw err;
    });
  }
  return initialization;
}

app.initialize = initialize;

app.use(async (req, res, next) => {
  try {
    await initialize();
    next();
  } catch (err) {
    next(err);
  }
});

// Persist successful mutations before sending the response. This matters on
// Vercel, where background work after a response can be frozen mid-flight.
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const sendJson = res.json.bind(res);
  let alreadySent = false;

  res.json = (body) => {
    if (alreadySent) return res;
    alreadySent = true;
    // Failed validation/auth requests rarely change data; skip the disk write.
    if (res.statusCode >= 400) return sendJson(body);
    // Read-only POST endpoints: skip the (cheap but non-zero) diff scan.
    if (req.path === '/api/auth/login' || req.path === '/api/chat') return sendJson(body);

    db.persist()
      .catch(err => console.error('[db] Failed to persist changes:', err.message))
      .finally(() => sendJson(body));
    return res;
  };

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

// Persist on shutdown for long-running local/demo servers. Serverless hosts
// are handled by the persistence middleware above.
if (!process.env.VERCEL) {
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, flushing data...`);
    try {
      await db.persist();
    } catch (err) {
      console.error('[db] Final persist failed:', err.message);
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
