const TestResult = require('../models/TestResult');
const TestOrder = require('../models/TestOrder');
const Test = require('../models/Test');
const { generateReportId } = require('../utils/generateId');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');

// Get orders for result entry (with filter)
exports.getOrdersForResult = async (req, res) => {
  const { search, status = 'ORDERED', dateFilter = 'today', page = 1, limit = 15 } = req.query;
  const q = {};
  if (status) q['items.status'] = status;

  const range = getDateRange(dateFilter);
  if (range) q.createdAt = { $gte: range.start, $lte: range.end };

  const orders = await TestOrder.find(q)
    .populate('patient', 'patientId name phone age gender serial')
    .sort({ createdAt: -1 });

  // Filter by search (patient name / id / phone)
  let filtered = orders;
  if (search) {
    filtered = orders.filter((o) =>
      o.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.patient?.patientId?.toLowerCase().includes(search.toLowerCase()) ||
      o.patient?.phone?.includes(search)
    );
  }

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);
  res.json({ data: paged, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.saveResult = async (req, res) => {
  const { order, orderItemId, values, remarks, submit, requestPermission } = req.body;
  const testOrder = await TestOrder.findById(order);
  if (!testOrder) return res.status(404).json({ message: 'Order not found' });
  const item = testOrder.items.id(orderItemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const test = await Test.findById(item.test);

  const flaggedValues = (values || []).map((v) => {
    const param = test.parameters.find((p) => p.name === v.parameterName);
    let flag = '';
    if (param?.referenceRange && v.result) {
      const num = parseFloat(v.result);
      const match = param.referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
      if (!isNaN(num) && match) {
        const low = parseFloat(match[1]), high = parseFloat(match[2]);
        if (num < low) flag = 'LOW';
        else if (num > high) flag = 'HIGH';
        else flag = 'NORMAL';
      }
    }
    return { ...v, flag };
  });

  let result = await TestResult.findOne({ order, orderItemId });
  if (result) {
    result.values = flaggedValues;
    result.remarks = remarks || result.remarks;
    if (submit) result.status = 'SUBMITTED';
  } else {
    result = await TestResult.create({
      order, orderItemId,
      patient: testOrder.patient, test: item.test, testName: item.testName,
      sampleId: testOrder.orderNo, values: flaggedValues, remarks,
      status: submit ? 'SUBMITTED' : 'DRAFT',
      enteredBy: req.user._id,
    });
  }
  await result.save();
  item.status = submit ? 'SUBMITTED' : 'RESULT_ENTERED';
  await testOrder.save();
  await logAction(req, submit ? 'SUBMIT_RESULT' : 'SAVE_RESULT', 'TestResult', result._id, item.testName);
  res.json(result);
};

// Admin permits (grants permission)
exports.permitReport = async (req, res) => {
  const result = await TestResult.findById(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not found' });
  if (result.status !== 'SUBMITTED')
    return res.status(400).json({ message: 'Result must be submitted first' });
  result.status = 'PERMITTED';
  result.permittedBy = req.user._id;
  result.permittedAt = new Date();
  result.reportNo = await generateReportId();
  await result.save();

  const order = await TestOrder.findById(result.order);
  const item = order.items.id(result.orderItemId);
  if (item) { item.status = 'PERMITTED'; await order.save(); }
  await logAction(req, 'PERMIT_REPORT', 'TestResult', result._id, result.reportNo);
  res.json(result);
};

// Admin confirm (final approve after payment)
exports.confirmReport = async (req, res) => {
  const result = await TestResult.findById(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not found' });
  result.confirmedBy = req.user._id;
  result.confirmedAt = new Date();
  await result.save();
  res.json(result);
};

// Admin change status back (Released/Permitted → Submitted)
exports.changeStatus = async (req, res) => {
  const { status } = req.body;
  const result = await TestResult.findById(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not found' });
  result.status = status;
  await result.save();
  const order = await TestOrder.findById(result.order);
  const item = order?.items.id(result.orderItemId);
  if (item) { item.status = status; await order.save(); }
  res.json(result);
};

exports.releaseReport = async (req, res) => {
  const result = await TestResult.findById(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not found' });
  if (result.status !== 'PERMITTED')
    return res.status(403).json({ message: 'Permission not granted' });
  result.status = 'RELEASED';
  result.releasedBy = req.user._id;
  result.releasedAt = new Date();
  await result.save();
  const order = await TestOrder.findById(result.order);
  const item = order?.items.id(result.orderItemId);
  if (item) { item.status = 'RELEASED'; await order.save(); }
  res.json(result);
};

exports.rejectResult = async (req, res) => {
  const result = await TestResult.findById(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not found' });
  result.status = 'REJECTED';
  result.rejectReason = req.body.reason;
  await result.save();
  res.json(result);
};

exports.getResults = async (req, res) => {
  const { status, patient } = req.query;
  const q = {};
  if (status) q.status = status;
  if (patient) q.patient = patient;
  const results = await TestResult.find(q)
    .populate('patient', 'patientId name age gender phone serial')
    .populate('enteredBy', 'name').populate('permittedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(results);
};

exports.getResult = async (req, res) =>
  res.json(await TestResult.findById(req.params.id)
    .populate('patient').populate('enteredBy', 'name')
    .populate('permittedBy', 'name').populate('releasedBy', 'name'));

// Permission requests for admin
exports.getPermissionRequests = async (req, res) => {
  const { dateFilter = 'today', from, to } = req.query;
  const q = { status: { $in: ['SUBMITTED', 'PERMITTED', 'RELEASED'] } };
  if (from || to) {
    q.updatedAt = {};
    if (from) q.updatedAt.$gte = new Date(from);
    if (to) q.updatedAt.$lte = new Date(to);
  } else {
    const range = getDateRange(dateFilter);
    if (range) q.updatedAt = { $gte: range.start, $lte: range.end };
  }
  const results = await TestResult.find(q)
    .populate('patient', 'patientId name age gender phone serial')
    .populate('enteredBy', 'name')
    .populate('permittedBy', 'name')
    .sort({ updatedAt: -1 });
  res.json(results);
};