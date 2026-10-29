const express = require('express');
const router = express.Router();
const db = require('../store');
const { hospitalView } = require('../hospitalDirectory');

// GET /api/hospitals — public directory with address, helpline and map links.
router.get('/', async (req, res) => {
  try {
    const { city, type } = req.query;
    let results = [...db.hospitals.data];
    if (city) results = results.filter(h => h.city === city);
    if (type) results = results.filter(h => h.type === type);
    results.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    res.json(results.map(hospitalView));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  const hospital = db.hospitals.data.find(h => h._id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json(hospitalView(hospital));
});

module.exports = router;
