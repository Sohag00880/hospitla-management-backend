// const Patient = require('../models/Patient');
// const { generatePatientId } = require('../utils/generateId');
// const { logAction } = require('../utils/auditLogger');
// const { getDateRange } = require('../utils/dateFilter');

// exports.createPatient = async (req, res) => {
//   const data = { ...req.body, createdBy: req.user._id };
//   if (!data.doctor) return res.status(400).json({ message: 'Doctor required' });
//   const { patientId, serial } = await generatePatientId(data.doctor);
//   data.patientId = patientId;
//   data.serial = serial;
//   data.appointmentDate = data.appointmentDate || new Date();
//   const patient = await Patient.create(data);
//   await logAction(req, 'CREATE', 'Patient', patient._id, patient.patientId);
//   res.status(201).json(patient);
// };

// exports.getPatients = async (req, res) => {
//   const { search, doctor, dateFilter = 'today', from, to, page = 1, limit = 15 } = req.query;
//   const q = {};
//   if (search) q.$or = [
//     { name: { $regex: search, $options: 'i' } },
//     { phone: { $regex: search, $options: 'i' } },
//     { patientId: { $regex: search, $options: 'i' } },
//   ];
//   if (doctor) q.doctor = doctor;

//   if (from || to) {
//     q.appointmentDate = {};
//     if (from) q.appointmentDate.$gte = new Date(from);
//     if (to) q.appointmentDate.$lte = new Date(to);
//   } else {
//     const range = getDateRange(dateFilter);
//     if (range) q.appointmentDate = { $gte: range.start, $lte: range.end };
//   }

//   const total = await Patient.countDocuments(q);
//   const patients = await Patient.find(q)
//     .populate('doctor', 'name title designation medicalCollege')
//     .sort({ serial: -1, createdAt: -1 })
//     .skip((page - 1) * limit)
//     .limit(Number(limit));

//   const allForTotal = await Patient.find(q).select('consultationFee');
//   const totalFee = allForTotal.reduce((s, p) => s + (p.consultationFee || 0), 0);

//   res.json({ data: patients, total, page: Number(page), pages: Math.ceil(total / limit), totalFee });
// };

// exports.getPatient = async (req, res) => {
//   const p = await Patient.findById(req.params.id).populate('doctor');
//   if (!p) return res.status(404).json({ message: 'Not found' });
//   res.json(p);
// };

// exports.updatePatient = async (req, res) => {
//   const patient = await Patient.findById(req.params.id);
//   if (!patient) return res.status(404).json({ message: 'Not found' });

//   // Serial edit: only SUPER_ADMIN / ADMIN
//   if (req.body.serial && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
//     delete req.body.serial;
//   }
//   Object.assign(patient, req.body);
//   await patient.save();
//   await logAction(req, 'UPDATE', 'Patient', patient._id, patient.patientId);
//   res.json(patient);
// };

// exports.deletePatient = async (req, res) => {
//   if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role))
//     return res.status(403).json({ message: 'Only admin can delete' });
//   await Patient.findByIdAndDelete(req.params.id);
//   res.json({ message: 'Deleted' });
// };

// // Due list (for admin dashboard)
// exports.getDueList = async (req, res) => {
//   const TestOrder = require('../models/TestOrder');
//   const { dateFilter = 'today', from, to, page = 1, limit = 15 } = req.query;
//   const q = { dueAmount: { $gt: 0 } };
//   if (from || to) {
//     q.createdAt = {};
//     if (from) q.createdAt.$gte = new Date(from);
//     if (to) q.createdAt.$lte = new Date(to);
//   } else {
//     const range = getDateRange(dateFilter);
//     if (range) q.createdAt = { $gte: range.start, $lte: range.end };
//   }
//   const total = await TestOrder.countDocuments(q);
//   const orders = await TestOrder.find(q)
//     .populate('patient', 'patientId name phone serial')
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * limit)
//     .limit(Number(limit));
//   const totalDue = (await TestOrder.find(q).select('dueAmount'))
//     .reduce((s, o) => s + (o.dueAmount || 0), 0);

//   res.json({ data: orders, total, page: Number(page), pages: Math.ceil(total / limit), totalDue });
// };




























const Patient = require('../models/Patient');
const { generatePatientId } = require('../utils/generateId');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');


// ═══════════════════════════════════════════════════════
const getAppointmentDateRange = (filter) => {
  if (!filter || filter === 'all') return null;

  const TZ = 'Asia/Dhaka';
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const [y, m, d] = todayStr.split('-').map(Number);

  // UTC midnight boundaries (matches how appointmentDate is stored)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  switch (filter) {
    case 'today':
      return { start, end };
    case 'week': {
      // last 7 days including today
      const ws = new Date(Date.UTC(y, m - 1, d - 6, 0, 0, 0, 0));
      return { start: ws, end };
    }
    case 'month': {
      const ms = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      return { start: ms, end };
    }
    case 'year': {
      const ys = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      return { start: ys, end };
    }
    default:
      return null;
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/patients
// ═══════════════════════════════════════════════════════
exports.createPatient = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (!data.doctor) return res.status(400).json({ message: 'Doctor required' });

    const { patientId, serial } = await generatePatientId(data.doctor);
    data.patientId = patientId;
    data.serial = serial;

    // Normalize appointmentDate to UTC midnight
    if (data.appointmentDate) {
      const str = String(data.appointmentDate);
      // If input is "YYYY-MM-DD" or "YYYY-MM-DDThh:mm:ss...", take only date part
      const datePart = str.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        data.appointmentDate = new Date(datePart + 'T00:00:00.000Z');
      } else {
        data.appointmentDate = new Date();
      }
    } else {
      data.appointmentDate = new Date();
    }

    const patient = await Patient.create(data);
    await logAction(req, 'CREATE', 'Patient', patient._id, patient.patientId);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/patients
// Query: search, doctor, dateFilter, from, to, page, limit
// ═══════════════════════════════════════════════════════
exports.getPatients = async (req, res) => {
  try {
    const {
      search,
      doctor,
      dateFilter = 'today',
      from,
      to,
      page = 1,
      limit = 15,
    } = req.query;

    const q = {};

    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
      ];
    }
    if (doctor) q.doctor = doctor;

    // ── Date filter on appointmentDate ──
    if (from || to) {
      q.appointmentDate = {};
      if (from) q.appointmentDate.$gte = new Date(String(from).slice(0, 10) + 'T00:00:00.000Z');
      if (to) q.appointmentDate.$lte = new Date(String(to).slice(0, 10) + 'T23:59:59.999Z');
    } else if (dateFilter && dateFilter !== 'all') {
      const range = getAppointmentDateRange(dateFilter);
      if (range) {
        q.appointmentDate = { $gte: range.start, $lte: range.end };
      }
    }

    const total = await Patient.countDocuments(q);
    const patients = await Patient.find(q)
      .populate('doctor', 'name title designation medicalCollege')
      .sort({ serial: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const allForTotal = await Patient.find(q).select('consultationFee');
    const totalFee = allForTotal.reduce((s, p) => s + (p.consultationFee || 0), 0);

    res.json({
      data: patients,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      totalFee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/patients/:id
// ═══════════════════════════════════════════════════════
exports.getPatient = async (req, res) => {
  const p = await Patient.findById(req.params.id).populate('doctor');
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
};

// ═══════════════════════════════════════════════════════
// PUT /api/patients/:id
// ═══════════════════════════════════════════════════════
exports.updatePatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Not found' });

  // Only SUPER_ADMIN / ADMIN can edit serial
  if (req.body.serial && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    delete req.body.serial;
  }

  // Normalize appointmentDate to UTC midnight (if being updated)
  if (req.body.appointmentDate) {
    const str = String(req.body.appointmentDate);
    const datePart = str.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      req.body.appointmentDate = new Date(datePart + 'T00:00:00.000Z');
    }
  }

  Object.assign(patient, req.body);
  await patient.save();
  await logAction(req, 'UPDATE', 'Patient', patient._id, patient.patientId);
  res.json(patient);
};

// ═══════════════════════════════════════════════════════
// DELETE /api/patients/:id
// ═══════════════════════════════════════════════════════
exports.deletePatient = async (req, res) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role))
    return res.status(403).json({ message: 'Only admin can delete' });
  await Patient.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

// ═══════════════════════════════════════════════════════
// GET /api/patients/due-list
// ═══════════════════════════════════════════════════════
exports.getDueList = async (req, res) => {
  try {
    const TestOrder = require('../models/TestOrder');
    const { dateFilter = 'today', from, to, page = 1, limit = 15 } = req.query;
    const q = { dueAmount: { $gt: 0 } };

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
      .populate('patient', 'patientId name phone serial')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const allForTotal = await TestOrder.find(q).select('dueAmount');
    const totalDue = allForTotal.reduce((s, o) => s + (o.dueAmount || 0), 0);

    res.json({
      data: orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      totalDue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};