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

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    donors: db.donors.data.length,
    hospitals: db.hospitals.data.length,
    users: db.users.data.length,
  });
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
