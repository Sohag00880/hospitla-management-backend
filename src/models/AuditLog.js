const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String, action: String, targetType: String,
  targetId: String, description: String, ip: String,
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditLogSchema);