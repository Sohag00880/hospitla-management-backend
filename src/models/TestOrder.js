const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  testName: String,
  fee: Number,
  status: {
    type: String,
    enum: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULT_ENTERED', 'SUBMITTED', 'PERMITTED', 'RELEASED'],
    default: 'ORDERED',
  },
});
const testOrderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  items: [orderItemSchema],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('TestOrder', testOrderSchema);