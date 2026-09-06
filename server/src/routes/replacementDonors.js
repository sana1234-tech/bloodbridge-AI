/**
 * Replacement donor registration for BloodBridge AI.
 *
 * Verified hospital staff can register a "replacement donor" that a patient's
 * family brought in person. The donor is added to the general donor pool, tagged
 * with source: "replacement donor via [institution name]", so they are available
 * for future matching.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../store');
const { authenticateToken, requireVerifiedStaff } = require('../middleware/auth');
const { PHONE_REGEX, BLOOD_GROUPS } = require('../utils/validation');
const { cityCoords } = require('../utils/geo');

const router = express.Router();

// POST /api/replacement-donors
router.post('/', authenticateToken, requireVerifiedStaff, async (req, res) => {
  try {
    const { name, phone, bloodGroup, age, city, gender } = req.body || {};
    const errors = [];

    if (!name || name.trim().length < 2) errors.push('Name is required (2+ characters).');
    if (!phone || !PHONE_REGEX.test(phone)) errors.push('Valid phone number is required.');
    if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
    if (!city) errors.push('City is required.');
    if (age !== undefined && (Number(age) < 1 || Number(age) > 120)) errors.push('Age must be valid.');

    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // Look up the staff member's institution
    const staffUser = db.users.data.find(u => u._id === req.user.userId);
    const institutionName = staffUser?.institutionName || 'Unknown Institution';

    // Create a user account for the replacement donor (auto-generated password)
    const autoPassword = `donor${Date.now().toString(36)}`;
    const hashedPassword = await bcrypt.hash(autoPassword, 10);

    const user = {
      _id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      role: 'donor',
      fullName: name.trim(),
      phone,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.users.data.push(user);

    // Create donor record
    const coords = cityCoords(city);
    const donor = {
      _id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      userId: user._id,
      name: name.trim(),
      bloodGroup,
      phone,
      gender: gender || 'male',
      age: age ? Number(age) : null,
      city,
      area: city,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      lastDonationDate: null,
      isAvailable: true,
      rating: 4.0,
      totalDonations: 0,
      healthScreening: null, // No health screening for replacement donors (done in person)
      source: `replacement donor via ${institutionName}`,
      registeredBy: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.donors.data.push(donor);

    res.status(201).json({
      message: 'Replacement donor registered successfully.',
      donor: { _id: donor._id, name: donor.name, bloodGroup: donor.bloodGroup, source: donor.source },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
