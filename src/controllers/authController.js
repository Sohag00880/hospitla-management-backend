const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
  const ok = await user.matchPassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  user.lastLogin = new Date(); await user.save();
  res.json({
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, permissions: user.permissions },
  });
};

exports.me = async (req, res) => res.json(req.user);