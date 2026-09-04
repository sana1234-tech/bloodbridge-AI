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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
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
  });
});

// Restore persisted data if available; otherwise seed fresh demo data.
// This keeps data intact across server restarts (important during demos).
if (db.load()) {
  console.log('Restored persisted data from disk.');
} else {
  console.log('No persisted data found. Seeding fresh demo data...');
  seedData();
}

// Persist every 5 seconds and on shutdown so a restart never loses data.
setInterval(() => db.persist(), 5000).unref();
process.on('SIGINT', () => { db.persist(); process.exit(0); });
process.on('SIGTERM', () => { db.persist(); process.exit(0); });

app.listen(PORT, () => {
  console.log(`BloodBridge AI server running on port ${PORT}`);
  console.log(`Donors: ${db.donors.data.length} | Hospitals: ${db.hospitals.data.length} | Demand Records: ${db.demandRecords.data.length}`);
});
