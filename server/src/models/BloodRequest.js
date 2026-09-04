const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  unitsNeeded: { type: Number, required: true, min: 1 },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium'],
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'fulfilled', 'cancelled'],
    default: 'pending',
  },
  matchedDonors: [{
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    matchScore: Number,
    distance: Number,
    contacted: { type: Boolean, default: false },
  }],
  contactNumber: { type: String },
  notes: { type: String },
}, { timestamps: true });

bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ bloodGroup: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
