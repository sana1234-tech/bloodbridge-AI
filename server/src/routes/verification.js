/**
 * Staff verification routes for BloodBridge AI.
 *
 * Only verified staff (admins) can approve or reject pending staff accounts.
 *
 * NOTE: In production, this would be a manual admin review process managed by
 * a dedicated admin panel, not open peer approval. This simulates admin review
 * for demo purposes — any verified hospital staff member can approve others.
 */
const express = require('express');
const db = require('../store');
const { authenticateToken, requireVerifiedStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/verification/pending — list pending staff accounts
router.get('/pending', authenticateToken, requireVerifiedStaff, (req, res) => {
  const pending = db.users.data
    .filter(u => u.role === 'staff' && u.verificationStatus === 'pending')
    .map(({ password: _, ...safe }) => safe);
  res.json(pending);
});

// POST /api/verification/:userId/approve — approve a pending staff account
router.post('/:userId/approve', authenticateToken, requireVerifiedStaff, (req, res) => {
  const user = db.users.data.find(u => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role !== 'staff') return res.status(400).json({ error: 'Only staff accounts can be approved.' });
  if (user.verificationStatus === 'verified') return res.status(400).json({ error: 'User is already verified.' });

  user.verificationStatus = 'verified';
  user.verifiedAt = new Date();
  user.verifiedBy = req.user.userId;
  user.updatedAt = new Date();

  const { password: _, ...safe } = user;
  res.json({ message: 'Staff account approved.', user: safe });
});

// POST /api/verification/:userId/reject — reject a pending staff account
router.post('/:userId/reject', authenticateToken, requireVerifiedStaff, (req, res) => {
  const user = db.users.data.find(u => u._id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role !== 'staff') return res.status(400).json({ error: 'Only staff accounts can be rejected.' });

  user.verificationStatus = 'rejected';
  user.updatedAt = new Date();

  const { password: _, ...safe } = user;
  res.json({ message: 'Staff account rejected.', user: safe });
});

module.exports = router;
