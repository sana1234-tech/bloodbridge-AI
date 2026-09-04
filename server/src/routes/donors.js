const express = require('express');
const router = express.Router();
const db = require('../store');
const { validateDonor, maskPhone } = require('../utils/validation');
const { donorEligibility } = require('../services/eligibility');

// Public donor view: phone numbers are masked — real contact details are only
// revealed through the AI matching process for an active request.
function publicDonorView(donor) {
  return {
    ...donor,
    phone: maskPhone(donor.phone),
    eligibility: donorEligibility(donor),
  };
}

// GET /api/donors
router.get('/', async (req, res) => {
  try {
    const { city, bloodGroup, available, eligible, page = 1, limit = 20 } = req.query;
    let results = [...db.donors.data];

    if (city) results = results.filter(d => d.city === city);
    if (bloodGroup) results = results.filter(d => d.bloodGroup === bloodGroup);
    if (available !== undefined) results = results.filter(d => d.isAvailable === (available === 'true'));
    if (eligible === 'true') results = results.filter(d => donorEligibility(d).eligible);

    const total = results.length;
    results.sort((a, b) => b.rating - a.rating);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = results.slice(skip, skip + parseInt(limit));

    res.json({
      donors: paginated.map(publicDonorView),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donors/:id
router.get('/:id', async (req, res) => {
  const donor = db.donors.data.find(d => d._id === req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  res.json(publicDonorView(donor));
});

// POST /api/donors
router.post('/', async (req, res) => {
  try {
    const { errors, sanitized } = validateDonor(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const donor = {
      ...sanitized,
      _id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 4.0,
      totalDonations: 0,
    };
    db.donors.data.push(donor);
    res.status(201).json(donor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
