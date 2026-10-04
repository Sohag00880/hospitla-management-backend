const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'PATHOLOGIST'],
    required: true,
  },
  permissions: [{ type: String }],
  isBlocked: { type: Boolean, default: false },
  lastLogin: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = function (pw) { return bcrypt.compare(pw, this.password); };

module.exports = mongoose.model('User', userSchema);