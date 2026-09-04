const express = require('express');
const router = express.Router();
const db = require('../store');
const { maskName } = require('../utils/validation');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const donors = db.donors.data;
    const hospitals = db.hospitals.data;
    const requests = db.bloodRequests.data;

    const totalDonors = donors.length;
    const availableDonors = donors.filter(d => d.isAvailable).length;
    const totalHospitals = hospitals.length;
    const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'matched').length;
    const criticalRequests = requests.filter(r => (r.status === 'pending' || r.status === 'matched') && r.urgencyLevel === 'critical').length;

    // Aggregate inventory
    const totalInventory = {};
    BLOOD_GROUPS.forEach(bg => {
      totalInventory[bg] = hospitals.reduce((sum, h) => sum + (h.bloodInventory[bg] || 0), 0);
    });

    // Donors by city
    const cityMap = {};
    donors.forEach(d => {
      if (!cityMap[d.city]) cityMap[d.city] = { _id: d.city, count: 0, available: 0 };
      cityMap[d.city].count++;
      if (d.isAvailable) cityMap[d.city].available++;
    });
    const donorsByCity = Object.values(cityMap).sort((a, b) => b.count - a.count);

    // Recent requests
    const recentRequests = [...requests]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(r => {
        const hospital = hospitals.find(h => h._id === r.hospitalId);
        return {
          ...r,
          // Patient identity is masked on public dashboard views
          patientName: maskName(r.patientName),
          contactNumber: undefined,
          hospitalId: hospital ? { _id: hospital._id, name: hospital.name, city: hospital.city } : null,
        };
      });

    res.json({
      totalDonors,
      availableDonors,
      totalHospitals,
      activeRequests,
      criticalRequests,
      totalInventory,
      donorsByCity,
      recentRequests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
