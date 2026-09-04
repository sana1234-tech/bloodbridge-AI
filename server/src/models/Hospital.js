const mongoose = require('mongoose');

const bloodGroupMap = {
  'A+': { type: Number, default: 0 },
  'A-': { type: Number, default: 0 },
  'B+': { type: Number, default: 0 },
  'B-': { type: Number, default: 0 },
  'AB+': { type: Number, default: 0 },
  'AB-': { type: Number, default: 0 },
  'O+': { type: Number, default: 0 },
  'O-': { type: Number, default: 0 },
};

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  area: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  bloodInventory: { type: Map, of: Number, default: () => ({}) },
  phone: { type: String, required: true },
  type: {
    type: String,
    enum: ['hospital', 'blood_bank'],
    default: 'hospital',
  },
}, { timestamps: true });

hospitalSchema.index({ city: 1 });
hospitalSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
