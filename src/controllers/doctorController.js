const Doctor = require('../models/Doctor');
const { logAction } = require('../utils/auditLogger');
const { getDateRange } = require('../utils/dateFilter');

exports.createDoctor = async (req, res) => {
  const doctor = await Doctor.create(req.body);
  await logAction(req, 'CREATE', 'Doctor', doctor._id, doctor.name);
  res.status(201).json(doctor);
};
exports.getDoctors = async (req, res) => {
  const { search, department } = req.query;
  const q = {};
  if (search) q.name = { $regex: search, $options: 'i' };
  if (department) q.department = department;
  const doctors = await Doctor.find(q).populate('department', 'name').sort({ createdAt: -1 });
  res.json(doctors);
};
exports.updateDoctor = async (req, res) =>
  res.json(await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.toggleActive = async (req, res) => {
  const d = await Doctor.findById(req.params.id);
  d.isActive = !d.isActive; await d.save(); res.json(d);
};
exports.deleteDoctor = async (req, res) => {
  await Doctor.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};