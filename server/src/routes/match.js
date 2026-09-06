const express = require('express');
const router = express.Router();
const { findMatchingDonors } = require('../services/donorMatching');
const { authenticateToken, optionalAuth, requireVerifiedStaff } = require('../middleware/auth');
const { maskPhone } = require('../utils/validation');
const { computeHealthFlags } = require('../services/healthScreening');
const { donorEligibility } = require('../services/eligibility');

// POST /api/match/:requestId — only verified staff can run AI matching
router.post('/:requestId', authenticateToken, requireVerifiedStaff, async (req, res) => {
  try {
    const result = await findMatchingDonors(req.params.requestId);
    // Add health flags for staff view
    result.matches = (result.matches || []).map(m => {
      const db = require('../store');
      const donor = db.donors.data.find(d => d._id === m.donorId);
      return {
        ...m,
        healthFlags: donor ? computeHealthFlags(donor) : [],
        eligibility: donor ? donorEligibility(donor) : null,
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/match/:requestId — privacy-aware match results
router.get('/:requestId', optionalAuth, async (req, res) => {
  try {
    const db = require('../store');
    const request = db.bloodRequests.data.find(r => r._id === req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Re-run matching live (unless fulfilled) so newly registered donors
    // appear immediately — not only in results frozen at creation time.
    if (request.status !== 'fulfilled') {
      try { findMatchingDonors(req.params.requestId); } catch { /* keep stored results on failure */ }
    }

    const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
    const isPostingStaff = req.user && req.user.userId === request.postedBy;

    const enrichedDonors = (request.matchedDonors || []).map(md => {
      const donor = db.donors.data.find(d => d._id === md.donorId);
      if (!donor) return null;

      const base = {
        ...md,
        donorId: {
          _id: donor._id,
          bloodGroup: donor.bloodGroup,
          city: donor.city,
          area: donor.area,
          rating: donor.rating,
        },
      };

      // Flag donors registered in the last 24h so the UI can badge them.
      const registeredAt = donor.createdAt ? new Date(donor.createdAt).getTime() : 0;
      base.recentlyRegistered = registeredAt > 0 && (Date.now() - registeredAt) < 24 * 60 * 60 * 1000;

      if (isPostingStaff) {
        // Posting staff sees full contact + health/eligibility flags
        base.donorId.name = donor.name;
        base.donorId.phone = donor.phone;
        base.donorId.age = donor.age;
        base.healthFlags = computeHealthFlags(donor);
        base.eligibility = donorEligibility(donor);
      } else {
        // Others see masked contact, no flags
        base.donorId.name = 'Donor';
        base.donorId.phone = maskPhone(donor.phone);
      }

      return base;
    }).filter(Boolean);

    res.json({
      request: {
        id: request._id,
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
