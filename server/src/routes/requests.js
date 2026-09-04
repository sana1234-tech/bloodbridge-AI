const express = require('express');
const router = express.Router();
const db = require('../store');
const { validateBloodRequest, maskName } = require('../utils/validation');

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

// GET /api/requests
router.get('/', async (req, res) => {
  try {
    const { status, bloodGroup, limit = 20 } = req.query;
    let results = [...db.bloodRequests.data];
    if (status) results = results.filter(r => r.status === status);
    if (bloodGroup) results = results.filter(r => r.bloodGroup === bloodGroup);
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginated = results.slice(0, parseInt(limit));

    // Populate hospital info; mask patient identity in public list views
    const enriched = paginated.map(r => {
      const hospital = db.hospitals.data.find(h => h._id === r.hospitalId);
      return {
        ...r,
        patientName: maskName(r.patientName),
        contactNumber: undefined,
        hospitalId: hospital ? { _id: hospital._id, name: hospital.name, city: hospital.city, area: hospital.area } : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/:id
router.get('/:id', async (req, res) => {
  const request = db.bloodRequests.data.find(r => r._id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
  res.json({ ...request, contactNumber: undefined, hospitalId: hospital || null });
});

// POST /api/requests
router.post('/', async (req, res) => {
  try {
    const { errors, sanitized } = validateBloodRequest(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const hospital = db.hospitals.data.find(h => h._id === sanitized.hospitalId);
    if (!hospital) return res.status(400).json({ error: 'Selected hospital does not exist.' });

    const request = {
      ...sanitized,
      _id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
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

// PATCH /api/requests/:id/fulfill — close the loop when blood is provided.
// Confirms which matched donors actually donated, then:
//   1. Marks the request fulfilled
//   2. Puts donating donors into their resting window (unavailable + lastDonationDate = today)
//   3. Records fulfilled units in demand history so predictions learn from real outcomes
//   4. Restocks any surplus donated units into the hospital's inventory
router.patch('/:id/fulfill', async (req, res) => {
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
