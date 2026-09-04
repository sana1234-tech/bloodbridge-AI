const mongoose = require('mongoose');

const demandRecordSchema = new mongoose.Schema({
  city: { type: String, required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  date: { type: Date, required: true },
  unitsRequested: { type: Number, required: true },
  unitsFulfilled: { type: Number, required: true },
});

demandRecordSchema.index({ city: 1, bloodGroup: 1, date: 1 });

module.exports = mongoose.model('DemandRecord', demandRecordSchema);
