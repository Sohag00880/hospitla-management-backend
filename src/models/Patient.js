const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  serial: { type: Number, required: true },  // 1, 2, 3 (per doctor per day)
  name: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  age: { type: Number, required: true },
  phone: String,
  address: String,
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, default: Date.now },   // auto
  consultationFee: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Patient', patientSchema);