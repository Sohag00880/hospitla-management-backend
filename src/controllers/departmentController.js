const Department = require('../models/Department');

exports.create = async (req, res) => {
  try { res.status(201).json(await Department.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
};
exports.list = async (req, res) => res.json(await Department.find().sort({ name: 1 }));
exports.update = async (req, res) =>
  res.json(await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.remove = async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};