const router = require('express').Router();
const { protect } = require('../middleware/auth');
const TestResult = require('../models/TestResult');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const pdf = require('../utils/pdfGenerator');

router.use(protect);

router.get('/:id/pdf', async (req, res) => {
  const result = await TestResult.findById(req.params.id)
    .populate('patient').populate('permittedBy', 'name');
  if (!result) return res.status(404).json({ message: 'Not found' });
  if (!['PERMITTED', 'RELEASED'].includes(result.status))
    return res.status(403).json({ message: 'Report not permitted yet' });
  await pdf.generateReportPDF(result, res);
});

router.get('/patient/:id/slip', async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  const doctor = patient?.doctor ? await Doctor.findById(patient.doctor) : null;
  pdf.generatePatientSlip(patient, doctor, res);
});

router.get('/order/:id/invoice', async (req, res) => {
  const TestOrder = require('../models/TestOrder');
  const order = await TestOrder.findById(req.params.id).populate('patient');
  pdf.generateInvoice(order, res);
});

// Urine Report PDF
router.get('/urine/:id/pdf', async (req, res) => {
  const UrineReport = require('../models/UrineReport');
  const report = await UrineReport.findById(req.params.id)
    .populate('patient')
    .populate('doctor');
  if (!report) return res.status(404).json({ message: 'Not found' });
  const pdf = require('../utils/pdfGenerator');
  await pdf.generateUrineReportPDF(report, res);
});


// CBC Report PDF
router.get('/cbc/:id/pdf', async (req, res) => {
  const CbcReport = require('../models/CbcReport');
  const report = await CbcReport.findById(req.params.id)
    .populate('patient')
    .populate('doctor');
  if (!report) return res.status(404).json({ message: 'Not found' });
  const pdf = require('../utils/pdfGenerator');
  await pdf.generateCbcReportPDF(report, res);
});

module.exports = router;