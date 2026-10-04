const CbcReport = require('../models/CbcReport');
const Patient = require('../models/Patient');
const Counter = require('../models/Counter');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');

// ═══════════════════════════════════════════════════════
// Default CBC Template
// ═══════════════════════════════════════════════════════
const DEFAULT_TEMPLATE = [
  { type: 'title', test: 'CBC (Cell Counter)' },
  {
    type: 'row', test: 'Haemoglobin', result: '',
    reference: 'Male: 12-18 g/dl, Female: 11-16 g/dl', unit: 'g/dl',
  },
  {
    type: 'row', test: 'ESR(Westergren Method)', result: '',
    reference: 'Male: 0-10 mm in 1st Hour, Female: 0-20 mm in 1st Hour',
    unit: 'mm in 1st Hour',
  },

  { type: 'section', test: 'TOTAL COUNT' },
  { type: 'row', test: 'RBC', result: '', reference: '4.5-5.5 Milion/cmm', unit: 'Milion/cmm' },
  { type: 'row', test: 'WBC', result: '', reference: '4,000-11,000/cmm', unit: '/cmm' },
  { type: 'row', test: 'Platelets', result: '', reference: '1,50,000-4,50,000/cmm', unit: '/cmm' },

  { type: 'section', test: 'DIFFERENTIAL COUNT' },
  { type: 'row', test: 'Neutrophils', result: '', reference: '40-75 %', unit: '%' },
  { type: 'row', test: 'Lymphocytes', result: '', reference: '20-45 %', unit: '%' },
  { type: 'row', test: 'Monocytes', result: '', reference: '2-8 %', unit: '%' },
  { type: 'row', test: 'Eosinophils', result: '', reference: '1-6 %', unit: '%' },
  { type: 'row', test: 'Basophils', result: '', reference: '0-0.1%', unit: '%' },

  { type: 'section', test: 'RBC Panel' },
  { type: 'row', test: 'HCT/PCV', result: '', reference: '35.0-55.0%', unit: '%' },
  { type: 'row', test: 'MCV', result: '', reference: '75.0-100.0fl', unit: 'fl' },
  { type: 'row', test: 'MCH', result: '', reference: '25.0-35.0pg', unit: 'pg' },
  { type: 'row', test: 'MCHC', result: '', reference: '29.0-36.0g/dl', unit: 'g/dl' },
];

// ═══════════════════════════════════════════════════════
// Auto Report No: CBC + YY + MM + 4-digit serial
// Example: CBC26100001
// ═══════════════════════════════════════════════════════
const generateCbcReportNo = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const key = `cbc_${yy}${mm}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `CBC${yy}${mm}${String(counter.seq).padStart(4, '0')}`;
};

// ═══════════════════════════════════════════════════════
// GET /api/cbc/template
// ═══════════════════════════════════════════════════════
exports.getTemplate = (req, res) => {
  res.json(DEFAULT_TEMPLATE);
};

// ═══════════════════════════════════════════════════════
// GET /api/cbc/find-patient/:patientId
// ═══════════════════════════════════════════════════════
exports.findPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ patientId }).populate('doctor');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const existingReport = await CbcReport.findOne({
      patient: patient._id,
    }).sort({ createdAt: -1 });

    res.json({
      patient,
      existingReport: existingReport || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/cbc
// ═══════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { patient, doctor, rows, remarks, status } = req.body;

    if (!patient) {
      return res.status(400).json({ message: 'Patient is required' });
    }

    const reportNo = await generateCbcReportNo();

    const report = await CbcReport.create({
      reportNo,
      patient,
      doctor: doctor || null,
      testName: 'CBC (Cell Counter)',
      rows: rows && rows.length > 0 ? rows : DEFAULT_TEMPLATE,
      remarks: remarks || '',
      status: status || 'SAVED',
      enteredBy: req.user._id,
      reportDate: new Date(),
    });

    await logAction(req, 'CREATE', 'CbcReport', report._id, reportNo);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/cbc
// Query: search, dateFilter, from, to, page, limit
// ═══════════════════════════════════════════════════════
exports.list = async (req, res) => {
  try {
    const {
      search,
      dateFilter = 'today',
      from,
      to,
      page = 1,
      limit = 15,
    } = req.query;

    const q = {};

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    } else {
      const range = getDateRange(dateFilter);
      if (range) {
        q.createdAt = { $gte: range.start, $lte: range.end };
      }
    }

    if (search) {
      const patients = await Patient.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      q.patient = { $in: patients.map((p) => p._id) };
    }

    const total = await CbcReport.countDocuments(q);

    const data = await CbcReport.find(q)
      .populate('patient', 'patientId name age gender phone serial')
      .populate('doctor', 'name title designation medicalCollege')
      .populate('enteredBy', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      data,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/cbc/:id
// ═══════════════════════════════════════════════════════
exports.get = async (req, res) => {
  try {
    const report = await CbcReport.findById(req.params.id)
      .populate('patient')
      .populate('doctor')
      .populate('enteredBy', 'name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// PUT /api/cbc/:id
// ═══════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const report = await CbcReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.body.rows) report.rows = req.body.rows;
    if (req.body.remarks !== undefined) report.remarks = req.body.remarks;
    if (req.body.status) report.status = req.body.status;
    if (req.body.doctor) report.doctor = req.body.doctor;

    await report.save();

    await logAction(req, 'UPDATE', 'CbcReport', report._id, report.reportNo);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// DELETE /api/cbc/:id
// ═══════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const report = await CbcReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await logAction(req, 'DELETE', 'CbcReport', report._id, report.reportNo);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};