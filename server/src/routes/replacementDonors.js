/**
 * Replacement donor registration for BloodBridge AI.
 *
 * Verified hospital staff can register a "replacement donor" that a patient's
 * family brought in person. The donor is added to the general donor pool, tagged
 * with source: "replacement donor via [institution name]", so they are available
 * for future matching.
 */
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../store');
const { authenticateToken, requireVerifiedStaff } = require('../middleware/auth');
const { PHONE_REGEX, BLOOD_GROUPS, normalizePhone } = require('../utils/validation');
const { cityCoords } = require('../utils/geo');

const router = express.Router();
const GENDERS = ['male', 'female', 'other'];

// POST /api/replacement-donors
router.post('/', authenticateToken, requireVerifiedStaff, async (req, res) => {
  try {
    const { name, bloodGroup, age, city, gender } = req.body || {};
    const phone = normalizePhone(req.body?.phone);
    const errors = [];

    if (!name || name.trim().length < 2) errors.push('Name is required (2+ characters).');
    if (!phone || !PHONE_REGEX.test(phone)) errors.push('Valid phone number is required.');
    if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
    if (!city) errors.push('City is required.');
    if (gender !== undefined && !GENDERS.includes(gender)) errors.push('Gender must be male, female, or other.');
    if (age !== undefined && age !== null && (Number(age) < 18 || Number(age) > 65)) {
      errors.push('Donor age must be between 18 and 65.');
    }

    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // One phone number = one account/donor record.
    if (db.users.data.some(u => u.phone === phone) || db.donors.data.some(d => d.phone === phone)) {
      return res.status(409).json({ error: 'A donor with this phone number already exists.' });
    }

    // Look up the staff member's institution
    const staffUser = db.users.data.find(u => u._id === req.user.userId);
    const institutionName = staffUser?.institutionName || 'Unknown Institution';

    // Create a user account for the replacement donor with an unguessable
    // random password (it is never returned or shown, so the account cannot
    // be taken over by guessing a timestamp-based value).
    const autoPassword = crypto.randomBytes(24).toString('base64url');
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
      // No questionnaire was completed: staff must screen the donor in person.
      // computeHealthFlags() surfaces this as a staff-only warning.
      healthScreening: null,
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
