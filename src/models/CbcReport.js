const mongoose = require('mongoose');

const cbcRowSchema = new mongoose.Schema({
  type: { type: String, enum: ['title', 'section', 'row'], default: 'row' },
  test: { type: String, required: true },
  result: { type: String, default: '' },
  reference: { type: String, default: '' },
  unit: { type: String, default: '' },
}, { _id: false });

const cbcReportSchema = new mongoose.Schema({
  reportNo: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  testName: { type: String, default: 'CBC (Cell Counter)' },
  rows: [cbcRowSchema],
  remarks: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT', 'SAVED', 'SUBMITTED'], default: 'SAVED' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CbcReport', cbcReportSchema);