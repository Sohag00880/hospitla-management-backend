const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');

exports.createUser = async (req, res) => {
  const { name, username, email, password, role, permissions } = req.body;
  if (await User.findOne({ username })) return res.status(400).json({ message: 'Username exists' });
  const user = await User.create({ name, username, email, password, role, permissions });
  await logAction(req, 'CREATE', 'User', user._id, username);
  res.status(201).json(user);
};
exports.getUsers = async (req, res) => {
  res.json(await User.find().select('-password').sort({ createdAt: -1 }));
};
exports.toggleBlock = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (user.role === 'SUPER_ADMIN') return res.status(403).json({ message: 'Cannot block super admin' });
  user.isBlocked = !user.isBlocked; await user.save();
  await logAction(req, user.isBlocked ? 'BLOCK' : 'UNBLOCK', 'User', user._id, user.username);
  res.json(user);
};
exports.updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const { name, email, role, permissions, password } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (permissions) user.permissions = permissions;
  if (password) user.password = password;
  await user.save(); res.json(user);
};
exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user?.role === 'SUPER_ADMIN') return res.status(403).json({ message: 'Cannot delete super admin' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};