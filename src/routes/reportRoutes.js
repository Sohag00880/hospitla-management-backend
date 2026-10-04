const router = require('express').Router();
const { protect } = require('../middleware/auth');
const TestResult = require('../models/TestResult');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const TestOrder = require('../models/TestOrder');
const UrineReport = require('../models/UrineReport');
const CbcReport = require('../models/CbcReport');
const pdf = require('../utils/pdfGenerator');

router.use(protect);

/* ═══════════════════════════════════════════════════════
   Lab Result Report PDF
   Permission system REMOVED
   SUBMITTED / PERMITTED / RELEASED — all can view
   ═══════════════════════════════════════════════════════ */
router.get('/:id/pdf', async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id)
      .populate('patient')
      .populate('permittedBy', 'name');

    if (!result) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (['DRAFT', 'REJECTED'].includes(result.status)) {
      return res.status(403).json({
        message: `Please submit the result first. Current status: ${result.status}`,
      });
    }

    await pdf.generateReportPDF(result, res);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════ Patient Slip PDF ═══════════ */
router.get('/patient/:id/slip', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doctor = patient.doctor
      ? await Doctor.findById(patient.doctor)
      : null;

    pdf.generatePatientSlip(patient, doctor, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════ Test Order Invoice PDF ═══════════ */
router.get('/order/:id/invoice', async (req, res) => {
  try {
    const order = await TestOrder.findById(req.params.id).populate('patient');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    pdf.generateInvoice(order, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════ Urine Report PDF ═══════════ */
router.get('/urine/:id/pdf', async (req, res) => {
  try {
    const report = await UrineReport.findById(req.params.id)
      .populate('patient')
      .populate('doctor');

    if (!report) return res.status(404).json({ message: 'Not found' });

    await pdf.generateUrineReportPDF(report, res);
  } catch (err) {
    console.error('Urine PDF error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════ CBC Report PDF ═══════════ */
router.get('/cbc/:id/pdf', async (req, res) => {
  try {
    const report = await CbcReport.findById(req.params.id)
      .populate('patient')
      .populate('doctor');

    if (!report) return res.status(404).json({ message: 'Not found' });

    await pdf.generateCbcReportPDF(report, res);
  } catch (err) {
    console.error('CBC PDF error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;