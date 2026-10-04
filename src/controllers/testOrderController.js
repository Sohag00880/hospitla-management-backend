const TestOrder = require('../models/TestOrder');
const Test = require('../models/Test');
const Patient = require('../models/Patient');
const { generateOrderNo } = require('../utils/generateId');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');

exports.createOrder = async (req, res) => {
  const { patient, doctor, testIds, paidAmount = 0 } = req.body;
  const tests = await Test.find({ _id: { $in: testIds } });
  const items = tests.map((t) => ({
    test: t._id, testName: t.name,
    fee: (t.parameters || []).some((p) => p.fee > 0)
      ? t.parameters.reduce((s, p) => s + (p.fee || 0), 0)
      : t.baseFee,
    status: 'ORDERED',
  }));
  const totalAmount = items.reduce((s, i) => s + (i.fee || 0), 0);
  const dueAmount = Math.max(totalAmount - paidAmount, 0);
  let paymentStatus = 'UNPAID';
  if (paidAmount >= totalAmount) paymentStatus = 'PAID';
  else if (paidAmount > 0) paymentStatus = 'PARTIAL';

  const order = await TestOrder.create({
    orderNo: await generateOrderNo(),
    patient, doctor, items, totalAmount, paidAmount, dueAmount,
    paymentStatus, createdBy: req.user._id,
  });
  await logAction(req, 'CREATE', 'TestOrder', order._id, order.orderNo);
  res.status(201).json(order);
};

exports.getOrders = async (req, res) => {
  const { search, dateFilter = 'today', from, to, page = 1, limit = 15, patient } = req.query;
  const q = {};
  if (patient) q.patient = patient;
  if (search) q['items.testName'] = { $regex: search, $options: 'i' };

  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  } else {
    const range = getDateRange(dateFilter);
    if (range) q.createdAt = { $gte: range.start, $lte: range.end };
  }

  const total = await TestOrder.countDocuments(q);
  const orders = await TestOrder.find(q)
    .populate('patient', 'patientId name age gender phone serial')
    .populate('doctor', 'name title designation')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const allForTotal = await TestOrder.find(q).select('totalAmount paidAmount dueAmount');
  const totalAmount = allForTotal.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalPaid = allForTotal.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const totalDue = allForTotal.reduce((s, o) => s + (o.dueAmount || 0), 0);

  res.json({
    data: orders, total, page: Number(page),
    pages: Math.ceil(total / limit),
    totalAmount, totalPaid, totalDue,
  });
};

exports.getOrder = async (req, res) =>
  res.json(await TestOrder.findById(req.params.id).populate('patient').populate('doctor'));

exports.updatePayment = async (req, res) => {
  const { paidAmount } = req.body;
  const order = await TestOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  order.paidAmount = paidAmount;
  order.dueAmount = Math.max(order.totalAmount - paidAmount, 0);
  order.paymentStatus = paidAmount >= order.totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
  await order.save();
  res.json(order);
};

// Find patient by ID (for order form)
exports.findPatient = async (req, res) => {
  const { patientId } = req.params;
  const patient = await Patient.findOne({ patientId }).populate('doctor');
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
};

exports.deleteOrder = async (req, res) => {
  try {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Only admin can delete orders' });
    }

    const order = await TestOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await logAction(req, 'DELETE', 'TestOrder', order._id, order.orderNo);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};