const express = require('express');
const router = express.Router();
const { predictDemand, backtestAccuracy } = require('../services/demandPrediction');

// GET /api/predictions/accuracy - Backtested model accuracy (predicted vs actual)
router.get('/accuracy', async (req, res) => {
  try {
    const { city, bloodGroup, testDays } = req.query;
    const result = backtestAccuracy(
      city || null,
      bloodGroup || null,
      testDays ? Math.min(Math.max(parseInt(testDays) || 14, 7), 30) : 14
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions - Get demand predictions
router.get('/', async (req, res) => {
  try {
    const { city, bloodGroup, days } = req.query;
    const predictions = await predictDemand(
      city || null,
      bloodGroup || null,
      days ? parseInt(days) : 7
    );
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
