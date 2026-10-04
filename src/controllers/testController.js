const Test = require('../models/Test');
const TestCategory = require('../models/TestCategory');

exports.createCategory = async (req, res) => res.status(201).json(await TestCategory.create(req.body));
exports.getCategories = async (req, res) => res.json(await TestCategory.find().sort({ name: 1 }));
exports.updateCategory = async (req, res) =>
  res.json(await TestCategory.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteCategory = async (req, res) => {
  await TestCategory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

exports.createTest = async (req, res) => res.status(201).json(await Test.create(req.body));
exports.getTests = async (req, res) =>
  res.json(await Test.find().populate('category', 'name').sort({ createdAt: -1 }));
exports.getTest = async (req, res) => res.json(await Test.findById(req.params.id).populate('category'));
exports.updateTest = async (req, res) =>
  res.json(await Test.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteTest = async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};