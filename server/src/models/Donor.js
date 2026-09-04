const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  phone: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male',
  },
  city: { type: String, required: true },
  area: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  lastDonationDate: { type: Date },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalDonations: { type: Number, default: 0 },
}, { timestamps: true });

donorSchema.index({ bloodGroup: 1, isAvailable: 1 });
donorSchema.index({ city: 1 });
donorSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Donor', donorSchema);
