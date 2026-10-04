const mongoose = require('mongoose');
const operationCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  defaultCharge: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('OperationCategory', operationCategorySchema);