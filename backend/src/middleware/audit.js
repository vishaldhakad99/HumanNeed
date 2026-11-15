const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const recordAudit = async (req, action, details = {}) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      user: userId,
      action,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      details,
    });
  } catch (error) {
    logger.error('Failed to write audit log:', error.message);
  }
};

module.exports = { recordAudit };
