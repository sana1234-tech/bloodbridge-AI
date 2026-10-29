const express = require('express');
const router = express.Router();
const db = require('../store');
const { maskPhone } = require('../utils/validation');
const { donorEligibility } = require('../services/eligibility');
const { optionalAuth } = require('../middleware/auth');
const { computeHealthFlags } = require('../services/healthScreening');

function roundCoord(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

// Public donor view: phone numbers are masked and exact home coordinates are
// reduced to ~1 km precision. The internal userId is never exposed.
// Real contact details are only revealed through the matching process for an
// active request, to the staff member who posted it.
function publicDonorView(donor, isStaff = false) {
  const view = {
    _id: donor._id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    phone: maskPhone(donor.phone),
    gender: donor.gender,
    age: donor.age ?? null,
    city: donor.city,
    area: donor.area,
    lat: roundCoord(donor.lat),
    lng: roundCoord(donor.lng),
    lastDonationDate: donor.lastDonationDate,
    isAvailable: donor.isAvailable,
    rating: donor.rating,
    totalDonations: donor.totalDonations || 0,
    source: donor.source,
    createdAt: donor.createdAt,
    eligibility: donorEligibility(donor),
  };
  // Health screening and flags are staff-only
  if (isStaff) {
    view.healthScreening = donor.healthScreening || null;
    view.healthFlags = computeHealthFlags(donor);
  }
  return view;
}

// GET /api/donors
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { city, bloodGroup, available, eligible } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    let results = [...db.donors.data];

    if (city) results = results.filter(d => d.city === city);
    if (bloodGroup) results = results.filter(d => d.bloodGroup === bloodGroup);
    if (available !== undefined) results = results.filter(d => d.isAvailable === (available === 'true'));
    if (eligible === 'true') results = results.filter(d => donorEligibility(d).eligible);

    const total = results.length;
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const skip = (page - 1) * limit;
    const paginated = results.slice(skip, skip + limit);

    const isStaff = req.user && req.user.role === 'staff' && req.user.verificationStatus === 'verified';

    res.json({
      donors: paginated.map(d => publicDonorView(d, isStaff)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donors/:id
router.get('/:id', optionalAuth, (req, res) => {
  const donor = db.donors.data.find(d => d._id === req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  const isStaff = req.user && req.user.role === 'staff' && req.user.verificationStatus === 'verified';
  res.json(publicDonorView(donor, isStaff));
});

module.exports = router;
