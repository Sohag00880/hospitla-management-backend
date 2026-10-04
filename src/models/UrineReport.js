const mongoose = require('mongoose');

const urineRowSchema = new mongoose.Schema({
  type: { type: String, enum: ['section', 'row'], default: 'row' },
  test: { type: String, required: true },
  result: { type: String, default: '' },
  reference: { type: String, default: '' },
  unit: { type: String, default: '' },
}, { _id: false });

const urineReportSchema = new mongoose.Schema({
  reportNo: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  testName: { type: String, default: 'Urine R/E' },
  rows: [urineRowSchema],
  remarks: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT', 'SAVED', 'SUBMITTED'], default: 'SAVED' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UrineReport', urineReportSchema);