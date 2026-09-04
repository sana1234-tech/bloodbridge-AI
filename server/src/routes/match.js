const express = require('express');
const router = express.Router();
const { findMatchingDonors } = require('../services/donorMatching');

// POST /api/match/:requestId
router.post('/:requestId', async (req, res) => {
  try {
    const result = await findMatchingDonors(req.params.requestId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/match/:requestId
router.get('/:requestId', async (req, res) => {
  try {
    const db = require('../store');
    const request = db.bloodRequests.data.find(r => r._id === req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
    const enrichedDonors = (request.matchedDonors || []).map(md => {
      const donor = db.donors.data.find(d => d._id === md.donorId);
      return {
        ...md,
        donorId: donor ? {
          _id: donor._id,
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          phone: donor.phone,
          city: donor.city,
          area: donor.area,
          rating: donor.rating,
        } : null,
      };
    });

    res.json({
      request: {
        id: request._id,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsNeeded,
        urgencyLevel: request.urgencyLevel,
        hospital: hospital?.name || 'Unknown',
        hospitalArea: hospital?.area || 'Unknown',
      },
      matchedDonors: enrichedDonors,
      status: request.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
