// services/auditLogService.js
const AuditLog = require('../models/AuditLog')
const logger = require('../utils/logger')

// Never let an audit-logging failure break the actual payment flow —
// this is observability, not a business requirement. If Mongo hiccups
// while writing the log, the payment itself should still succeed.
const logEvent = async (eventType, { userId = null, paymentId = null, ipAddress = null, userAgent = null, metadata = {} } = {}) => {
  try {
    await AuditLog.create({ eventType, userId, paymentId, ipAddress, userAgent, metadata })
  } catch (error) {
    logger.error('audit_log_write_failed', { eventType, error: error.message })
    return
  }
  logger.info(eventType, { userId, paymentId, ipAddress, ...metadata })
}

module.exports = { logEvent }