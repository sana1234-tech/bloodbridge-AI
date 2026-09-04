const express = require('express');
const router = express.Router();
const db = require('../store');

// GET /api/hospitals
router.get('/', async (req, res) => {
  try {
    const { city, type } = req.query;
    let results = [...db.hospitals.data];
    if (city) results = results.filter(h => h.city === city);
    if (type) results = results.filter(h => h.type === type);
    results.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  const hospital = db.hospitals.data.find(h => h._id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json(hospital);
});

module.exports = router;
