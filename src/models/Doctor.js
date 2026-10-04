const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, default: '' },
  designation: { type: String, default: '' },
  medicalCollege: { type: String, default: '' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  specialization: { type: String, default: '' },
  phone: String,
  email: String,
  consultationFee: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Doctor', doctorSchema);