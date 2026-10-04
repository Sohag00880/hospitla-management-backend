const mongoose = require('mongoose');
const admitChargeSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  date: { type: Date, default: Date.now },
});
const admitPatientSchema = new mongoose.Schema({
  admitId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: String,
  patientPhone: String,
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  operationCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'OperationCategory', required: true },
  operationName: String,
  admitDate: { type: Date, required: true, default: Date.now },
  dischargeDate: Date,
  cabinOrBed: String,
  charges: [admitChargeSchema],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['ADMITTED', 'DISCHARGED'], default: 'ADMITTED' },
  remarks: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('AdmitPatient', admitPatientSchema);