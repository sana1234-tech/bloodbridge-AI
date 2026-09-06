const express = require('express');
const router = express.Router();
const db = require('../store');
const { validateBloodRequest, maskName } = require('../utils/validation');
const { authenticateToken, optionalAuth, requireVerifiedStaff, requireAuth } = require('../middleware/auth');
const { computeHealthFlags } = require('../services/healthScreening');
const { donorEligibility } = require('../services/eligibility');

/**
 * Upsert today's demand record for a city + blood group so real usage feeds
 * the prediction engine (closing the data loop).
 */
function upsertDemandRecord(city, bloodGroup, field, units) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let record = db.demandRecords.data.find(
    r => r.city === city && r.bloodGroup === bloodGroup && new Date(r.date).getTime() === today.getTime()
  );

  if (!record) {
    record = {
      _id: `dr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      city,
      bloodGroup,
      date: today,
      unitsRequested: 0,
      unitsFulfilled: 0,
      createdAt: new Date(),
    };
    db.demandRecords.data.push(record);
  }

  record[field] = (record[field] || 0) + units;
  record.updatedAt = new Date();
  return record;
}

/**
 * Build a privacy-safe public view of a blood request.
 * Patient name is NEVER shown. Only: blood group, units, hospital, city, urgency.
 */
function publicRequestView(r) {
  const hospital = db.hospitals.data.find(h => h._id === r.hospitalId);
  return {
    _id: r._id,
    bloodGroup: r.bloodGroup,
    unitsNeeded: r.unitsNeeded,
    urgencyLevel: r.urgencyLevel,
    status: r.status,
    hospitalId: hospital ? { _id: hospital._id, name: hospital.name, city: hospital.city, area: hospital.area } : null,
    createdAt: r.createdAt,
    // patientName, contactNumber, internalReference — all excluded from public view
    matchedDonors: (r.matchedDonors || []).map(m => ({
      donorId: m.donorId,
      matchScore: m.matchScore,
      distance: m.distance,
    })),
  };
}

// GET /api/requests — public feed (no patient info)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, bloodGroup, limit = 20 } = req.query;
    let results = [...db.bloodRequests.data];
    if (status) results = results.filter(r => r.status === status);
    if (bloodGroup) results = results.filter(r => r.bloodGroup === bloodGroup);
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginated = results.slice(0, parseInt(limit));

    const enriched = paginated.map(r => {
      const view = publicRequestView(r);
      // Staff who posted this request can see internalReference
      if (req.user && req.user.userId === r.postedBy) {
        view.internalReference = r.internalReference || '';
      }
      return view;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/my — requests posted by the current staff member
router.get('/my', authenticateToken, requireVerifiedStaff, (req, res) => {
  try {
    const myRequests = db.bloodRequests.data
      .filter(r => r.postedBy === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const enriched = myRequests.map(r => {
      const hospital = db.hospitals.data.find(h => h._id === r.hospitalId);
      // Get responses for this request
      const responses = db.donorResponses.data
        .filter(dr => dr.requestId === r._id)
        .map(dr => {
          const donor = db.donors.data.find(d => d._id === dr.donorId);
          if (!donor) return null;
          const eligibility = donorEligibility(donor);
          const healthFlags = computeHealthFlags(donor);
          return {
            _id: dr._id,
            donorId: donor._id,
            donorName: donor.name,
            donorPhone: donor.phone, // Full contact visible to posting staff only
            donorBloodGroup: donor.bloodGroup,
            donorCity: donor.city,
            respondedAt: dr.createdAt,
            // Staff-only flags
            healthFlags,
            eligibilityFlags: !eligibility.eligible ? [eligibility.reason] : [],
            daysSinceLastDonation: eligibility.daysSinceLastDonation,
          };
        })
        .filter(Boolean);

      return {
        _id: r._id,
        patientName: r.patientName, // Visible in My Requests (staff's own view)
        bloodGroup: r.bloodGroup,
        unitsNeeded: r.unitsNeeded,
        urgencyLevel: r.urgencyLevel,
        status: r.status,
        internalReference: r.internalReference || '',
        hospitalId: hospital ? { _id: hospital._id, name: hospital.name, city: hospital.city } : null,
        createdAt: r.createdAt,
        matchedDonors: r.matchedDonors || [],
        responses,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/:id — single request (privacy-aware)
router.get('/:id', optionalAuth, (req, res) => {
  const request = db.bloodRequests.data.find(r => r._id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
  const view = publicRequestView(request);

  // Staff who posted can see extra fields
  if (req.user && req.user.userId === request.postedBy) {
    view.patientName = request.patientName;
    view.contactNumber = request.contactNumber;
    view.internalReference = request.internalReference || '';
  }

  view.hospitalId = hospital || null;
  res.json(view);
});

// POST /api/requests — only verified staff can post
router.post('/', authenticateToken, requireVerifiedStaff, async (req, res) => {
  try {
    const { errors, sanitized } = validateBloodRequest(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const hospital = db.hospitals.data.find(h => h._id === sanitized.hospitalId);
    if (!hospital) return res.status(400).json({ error: 'Selected hospital does not exist.' });

    const request = {
      ...sanitized,
      _id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      postedBy: req.user.userId,
      status: 'pending',
      matchedDonors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.bloodRequests.data.push(request);

    // Close the loop: real requests feed today's demand history for predictions
    upsertDemandRecord(hospital.city, request.bloodGroup, 'unitsRequested', request.unitsNeeded);

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/requests/:id/respond — donor responds "I can help"
router.post('/:id/respond', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ error: 'Only donors can respond to requests.' });
    }

    const request = db.bloodRequests.data.find(r => r._id === req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.status === 'fulfilled') return res.status(400).json({ error: 'This request is already fulfilled.' });

    // Find the donor linked to this user
    const donor = db.donors.data.find(d => d.userId === req.user.userId);
    if (!donor) return res.status(404).json({ error: 'Donor profile not found.' });

    // Check for duplicate response
    const existing = db.donorResponses.data.find(
      dr => dr.requestId === request._id && dr.donorId === donor._id
    );
    if (existing) return res.status(409).json({ error: 'You have already responded to this request.' });

    const response = {
      _id: `dr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      requestId: request._id,
      donorId: donor._id,
      userId: req.user.userId,
      createdAt: new Date(),
    };
    db.donorResponses.data.push(response);

    res.status(201).json({ message: 'Your response has been recorded. The hospital staff will contact you.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/:id/responses — only the posting staff can see responses
router.get('/:id/responses', authenticateToken, requireVerifiedStaff, (req, res) => {
  try {
    const request = db.bloodRequests.data.find(r => r._id === req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    // Only the staff who posted this request can see donor contact info
    if (request.postedBy !== req.user.userId) {
      return res.status(403).json({ error: 'Only the posting staff can view responses.' });
    }

    const responses = db.donorResponses.data
      .filter(dr => dr.requestId === request._id)
      .map(dr => {
        const donor = db.donors.data.find(d => d._id === dr.donorId);
        if (!donor) return null;
        const eligibility = donorEligibility(donor);
        const healthFlags = computeHealthFlags(donor);
        return {
          _id: dr._id,
          donorId: donor._id,
          donorName: donor.name,
          donorPhone: donor.phone,
          donorBloodGroup: donor.bloodGroup,
          donorCity: donor.city,
          donorAge: donor.age,
          respondedAt: dr.createdAt,
          healthFlags,
          eligibilityFlags: !eligibility.eligible ? [eligibility.reason] : [],
          daysSinceLastDonation: eligibility.daysSinceLastDonation,
          totalDonations: donor.totalDonations,
        };
      })
      .filter(Boolean);

    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/:id/fulfill — close the loop when blood is provided.
router.patch('/:id/fulfill', authenticateToken, requireVerifiedStaff, async (req, res) => {
  try {
    const request = db.bloodRequests.data.find(r => r._id === req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status === 'fulfilled') return res.status(400).json({ error: 'Request is already fulfilled.' });
    if (request.status === 'cancelled') return res.status(400).json({ error: 'Cancelled requests cannot be fulfilled.' });

    const donorIds = Array.isArray(req.body?.donorIds) ? req.body.donorIds.filter(id => typeof id === 'string') : [];
    const matchedIds = (request.matchedDonors || []).map(m => m.donorId);
    const invalid = donorIds.filter(id => !matchedIds.includes(id));
    if (invalid.length) return res.status(400).json({ error: 'Some selected donors were not matched to this request.' });
    if (donorIds.length > request.unitsNeeded + 5) {
      return res.status(400).json({ error: `Too many donors selected (max ${request.unitsNeeded + 5}).` });
    }

    const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
    const donatedUnits = donorIds.length;

    donorIds.forEach(id => {
      const donor = db.donors.data.find(d => d._id === id);
      if (donor) {
        donor.isAvailable = false;
        donor.lastDonationDate = new Date();
        donor.totalDonations = (donor.totalDonations || 0) + 1;
        donor.updatedAt = new Date();
      }
    });

    if (hospital) {
      upsertDemandRecord(hospital.city, request.bloodGroup, 'unitsFulfilled', donatedUnits);
    }

    // Surplus donated units (beyond the patient's need) restock the blood bank
    let surplusUnitsRestocked = 0;
    if (hospital && donatedUnits > request.unitsNeeded) {
      surplusUnitsRestocked = donatedUnits - request.unitsNeeded;
      hospital.bloodInventory[request.bloodGroup] = (hospital.bloodInventory[request.bloodGroup] || 0) + surplusUnitsRestocked;
      hospital.updatedAt = new Date();
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    request.fulfilledDonorIds = donorIds;
    request.updatedAt = new Date();

    res.json({
      request,
      summary: {
        donorsDonated: donatedUnits,
        unitsNeeded: request.unitsNeeded,
        surplusUnitsRestocked,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
