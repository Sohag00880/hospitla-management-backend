const AdmitPatient = require('../models/AdmitPatient');
const OperationCategory = require('../models/OperationCategory');
const Patient = require('../models/Patient');
const { generateAdmitId } = require('../utils/generateId');

exports.createCategory = async (req, res) => res.status(201).json(await OperationCategory.create(req.body));
exports.getCategories = async (req, res) => res.json(await OperationCategory.find().sort({ name: 1 }));
exports.updateCategory = async (req, res) =>
  res.json(await OperationCategory.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteCategory = async (req, res) => {
  await OperationCategory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

exports.admitPatient = async (req, res) => {
  const patient = await Patient.findById(req.body.patient);
  const admitId = await generateAdmitId();
  const charges = req.body.charges || [];
  const totalAmount = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const paidAmount = req.body.paidAmount || 0;
  const admit = await AdmitPatient.create({
    ...req.body, admitId,
    patientName: patient.name, patientPhone: patient.phone,
    charges, totalAmount, paidAmount,
    dueAmount: Math.max(totalAmount - paidAmount, 0),
    createdBy: req.user._id,
  });
  res.status(201).json(admit);
};

exports.getAdmits = async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const admits = await AdmitPatient.find(q)
    .populate('patient', 'patientId name age gender phone')
    .populate('doctor', 'name title designation medicalCollege')
    .populate('operationCategory', 'name')
    .sort({ createdAt: -1 });
  res.json(admits);
};

exports.getAdmit = async (req, res) =>
  res.json(await AdmitPatient.findById(req.params.id)
    .populate('patient').populate('doctor').populate('operationCategory'));

exports.updateAdmit = async (req, res) => {
  const admit = await AdmitPatient.findById(req.params.id);
  if (!admit) return res.status(404).json({ message: 'Not found' });
  Object.assign(admit, req.body);
  if (req.body.charges) {
    admit.totalAmount = req.body.charges.reduce((s, c) => s + (c.amount || 0), 0);
    admit.dueAmount = Math.max(admit.totalAmount - admit.paidAmount, 0);
  }
  await admit.save();
  res.json(admit);
};

exports.discharge = async (req, res) => {
  const admit = await AdmitPatient.findById(req.params.id);
  if (!admit) return res.status(404).json({ message: 'Not found' });
  if (req.body.finalCharges) {
    admit.charges = req.body.finalCharges;
    admit.totalAmount = req.body.finalCharges.reduce((s, c) => s + (c.amount || 0), 0);
  }
  if (req.body.paidAmount !== undefined) admit.paidAmount = req.body.paidAmount;
  admit.dueAmount = Math.max(admit.totalAmount - admit.paidAmount, 0);
  admit.status = 'DISCHARGED';
  admit.dischargeDate = new Date();
  await admit.save();
  res.json(admit);
};

exports.deleteAdmit = async (req, res) => {
  await AdmitPatient.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

exports.admitPDF = async (req, res) => {
  const admit = await AdmitPatient.findById(req.params.id)
    .populate('doctor').populate('operationCategory');
  require('../utils/pdfGenerator').generateAdmitPDF(admit, res);
};