const mongoose = require('mongoose');
const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: String,
  referenceRange: String,
  normalValue: String,
  fee: { type: Number, default: 0 },
  displayOrder: { type: Number, default: 0 },
  group: { type: String, default: '' },
});
const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCategory' },
  baseFee: { type: Number, default: 0 },
  parameters: [parameterSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Test', testSchema);