const mongoose = require('mongoose');
const resultValueSchema = new mongoose.Schema({
  parameterName: String,
  result: String,
  unit: String,
  referenceRange: String,
  group: String,
  flag: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', ''], default: '' },
});
const testResultSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'TestOrder', required: true },
  orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: String,
  sampleId: String,
  values: [resultValueSchema],
  remarks: { type: String, default: '' },
  status: {
    type: String,
    enum: ['DRAFT', 'RESULT_ENTERED', 'SUBMITTED', 'PERMITTED', 'RELEASED', 'REJECTED'],
    default: 'DRAFT',
  },
  rejectReason: String,
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permittedAt: Date,
  releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  releasedAt: Date,
  reportNo: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
}, { timestamps: true });
module.exports = mongoose.model('TestResult', testResultSchema);