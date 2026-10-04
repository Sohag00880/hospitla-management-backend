const Test = require('../models/Test');
const TestCategory = require('../models/TestCategory');

/* ==================== CATEGORY ==================== */
exports.createCategory = async (req, res) => {
  try {
    const category = await TestCategory.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  res.json(await TestCategory.find().sort({ name: 1 }));
};

exports.updateCategory = async (req, res) => {
  try {
    const cat = await TestCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  await TestCategory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

/* ==================== TEST ==================== */
exports.createTest = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.parameters || data.parameters.length === 0) {
      data.parameters = [
        {
          name: data.name,                      
          unit: '',
          referenceRange: '',
          normalValue: '',
          fee: data.baseFee || 0,
          group: '',
          displayOrder: 0,
        },
      ];
    }

    const test = await Test.create(data);
    res.status(201).json(test);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTests = async (req, res) => {
  const tests = await Test.find().populate('category', 'name').sort({ createdAt: -1 });
  res.json(tests);
};

exports.getTest = async (req, res) => {
  const test = await Test.findById(req.params.id).populate('category');
  res.json(test);
};

exports.updateTest = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.parameters && data.parameters.length === 0) {
      data.parameters = [
        {
          name: data.name || 'Test',
          unit: '',
          referenceRange: '',
          normalValue: '',
          fee: data.baseFee || 0,
          group: '',
          displayOrder: 0,
        },
      ];
    }

    const test = await Test.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(test);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTest = async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};