/**
 * Authentication routes for BloodBridge AI.
 *
 * Two account types:
 *   - Staff (Hospital/Blood Bank): requires verification before posting requests
 *   - Donor: open registration with health screening questionnaire
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../store');
const { signToken, authenticateToken } = require('../middleware/auth');
const { validateStaffSignup, validateDonorSignup } = require('../utils/validation');
const { validateHealthScreening } = require('../services/healthScreening');
const { cityCoords } = require('../utils/geo');

const router = express.Router();

// ── Staff signup ─────────────────────────────────────────────────────────────
router.post('/signup/staff', async (req, res) => {
  try {
    const { errors, sanitized } = validateStaffSignup(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // Check for duplicate phone
    const existing = db.users.data.find(u => u.phone === sanitized.phone);
    if (existing) return res.status(409).json({ error: 'A user with this phone number already exists.' });

    const hashedPassword = await bcrypt.hash(sanitized.password, 10);

    const user = {
      _id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      role: 'staff',
      verificationStatus: 'pending',
      fullName: sanitized.fullName,
      phone: sanitized.phone,
      password: hashedPassword,
      institutionName: sanitized.institutionName,
      institutionLicenseNo: sanitized.institutionLicenseNo,
      city: sanitized.city,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.users.data.push(user);

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Donor signup ─────────────────────────────────────────────────────────────
router.post('/signup/donor', async (req, res) => {
  try {
    const { errors, sanitized } = validateDonorSignup(req.body || {});
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // Validate health screening
    const { errors: hsErrors, screening } = validateHealthScreening(req.body || {});
    if (hsErrors.length) return res.status(400).json({ error: hsErrors.join(' ') });

    // Check for duplicate phone
    const existing = db.users.data.find(u => u.phone === sanitized.phone);
    if (existing) return res.status(409).json({ error: 'A user with this phone number already exists.' });

    const hashedPassword = await bcrypt.hash(sanitized.password, 10);

    // Create user account
    const user = {
      _id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      role: 'donor',
      fullName: sanitized.name,
      phone: sanitized.phone,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.users.data.push(user);

    // Create donor record linked to user
    const coords = cityCoords(sanitized.city);
    const donor = {
      _id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      userId: user._id,
      name: sanitized.name,
      bloodGroup: sanitized.bloodGroup,
      phone: sanitized.phone,
      gender: sanitized.gender,
      age: sanitized.age,
      city: sanitized.city,
      area: sanitized.area,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      lastDonationDate: sanitized.lastDonationDate,
      isAvailable: true,
      rating: 4.0,
      totalDonations: 0,
      healthScreening: screening,
      source: 'self-registration',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.donors.data.push(donor);

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser, donor: { _id: donor._id } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { phone, role, password } = req.body || {};
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required.' });

    const user = db.users.data.find(u => u.phone === phone && (!role || u.role === role));
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;

    // Include linked donor ID for donor accounts
    let donorId = null;
    if (user.role === 'donor') {
      const donor = db.donors.data.find(d => d.userId === user._id);
      if (donor) donorId = donor._id;
    }

    res.json({ token, user: safeUser, donorId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Get current user profile ─────────────────────────────────────────────────
router.get('/me', authenticateToken, (req, res) => {
  const user = db.users.data.find(u => u._id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safeUser } = user;

  let donorId = null;
  if (user.role === 'donor') {
    const donor = db.donors.data.find(d => d.userId === user._id);
    if (donor) donorId = donor._id;
  }

  res.json({ user: safeUser, donorId });
});

module.exports = router;
