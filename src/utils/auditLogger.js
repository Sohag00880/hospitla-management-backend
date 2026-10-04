const AuditLog = require('../models/AuditLog');
const logAction = async (req, action, targetType, targetId, description) => {
  try {
    await AuditLog.create({
      user: req.user?._id, userName: req.user?.name,
      action, targetType, targetId: String(targetId || ''),
      description, ip: req.ip,
    });
  } catch (e) { console.error('Audit:', e.message); }
};
module.exports = { logAction };