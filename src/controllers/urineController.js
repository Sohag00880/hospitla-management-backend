const UrineReport = require('../models/UrineReport');
const Patient = require('../models/Patient');
const Counter = require('../models/Counter');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');

// ═══════════════════════════════════════════════════════
// Default Urine R/E Template
// ═══════════════════════════════════════════════════════
const DEFAULT_TEMPLATE = [
  { type: 'section', test: 'PHYSICAL EXAMINATION' },
  { type: 'row', test: 'Quantity', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Color', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Appearance', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Sediment', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Specific Gravity', result: '', reference: '', unit: '' },

  { type: 'section', test: 'CHEMICAL EXAMINATION' },
  { type: 'row', test: 'Reaction (PH)', result: '', reference: '', unit: '' },
  { type: 'row', test: 'B. J. Protein', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Ex. Phosphate', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Bilirubin', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Urobilinogen', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Nitrite', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Leukocyte Esterase', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Albumin', result: '', reference: '', unit: '' },
  { type: 'row', test: 'Sugar', result: '', reference: '', unit: '' },

  { type: 'section', test: 'MICROSCOPIC EXAMINATION' },
  { type: 'row', test: 'Pus Cell', result: '', reference: '', unit: '/HPF' },
  { type: 'row', test: 'Epithelial Cells', result: '', reference: '', unit: '/HPF' },
  { type: 'row', test: 'RBC', result: '', reference: '', unit: '/HPF' },
];

// ═══════════════════════════════════════════════════════
// Auto Report No: URN + YY + MM + 4-digit serial
// Example: URN26100001
// ═══════════════════════════════════════════════════════
const generateUrineReportNo = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const key = `urine_${yy}${mm}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `URN${yy}${mm}${String(counter.seq).padStart(4, '0')}`;
};

// ═══════════════════════════════════════════════════════
// GET /api/urine/template
// ═══════════════════════════════════════════════════════
exports.getTemplate = (req, res) => {
  res.json(DEFAULT_TEMPLATE);
};

// ═══════════════════════════════════════════════════════
// GET /api/urine/find-patient/:patientId
// ═══════════════════════════════════════════════════════
exports.findPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ patientId }).populate('doctor');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const existingReport = await UrineReport.findOne({
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
// POST /api/urine
// ═══════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const { patient, doctor, rows, remarks, status } = req.body;

    if (!patient) {
      return res.status(400).json({ message: 'Patient is required' });
    }

    const reportNo = await generateUrineReportNo();

    const report = await UrineReport.create({
      reportNo,
      patient,
      doctor: doctor || null,
      testName: 'Urine R/E',
      rows: rows && rows.length > 0 ? rows : DEFAULT_TEMPLATE,
      remarks: remarks || '',
      status: status || 'SAVED',
      enteredBy: req.user._id,
      reportDate: new Date(),
    });

    await logAction(req, 'CREATE', 'UrineReport', report._id, reportNo);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/urine
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

    // Date filter
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

    // Search (patient name / patientId / phone)
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

    const total = await UrineReport.countDocuments(q);

    const data = await UrineReport.find(q)
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
// GET /api/urine/:id
// ═══════════════════════════════════════════════════════
exports.get = async (req, res) => {
  try {
    const report = await UrineReport.findById(req.params.id)
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
// PUT /api/urine/:id
// ═══════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const report = await UrineReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.body.rows) report.rows = req.body.rows;
    if (req.body.remarks !== undefined) report.remarks = req.body.remarks;
    if (req.body.status) report.status = req.body.status;
    if (req.body.doctor) report.doctor = req.body.doctor;

    await report.save();

    await logAction(req, 'UPDATE', 'UrineReport', report._id, report.reportNo);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
// DELETE /api/urine/:id
// ═══════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const report = await UrineReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await logAction(req, 'DELETE', 'UrineReport', report._id, report.reportNo);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};