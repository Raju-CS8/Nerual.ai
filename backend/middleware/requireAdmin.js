// middleware/requireAdmin.js
// Gates the Admin Billing Dashboard routes. Must run AFTER `protect`
// (needs req.user). Kept separate from roleMiddleware.js — that file's
// requireOwner/requireAdminOrOwner/requireMember all operate on a
// :workspaceId param and a workspace's collaborator list, which is a
// different concept from this site-wide isAdmin flag on the User model.
const auditLogService = require('../services/auditLogService')

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authorized' })
  }

  if (!req.user.isAdmin) {
    // Fire-and-forget — a logging failure should never turn a correct
    // 403 into a 500. Useful signal for whether someone is probing
    // admin endpoints with a regular account.
    auditLogService.logEvent('admin_access_denied', {
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      metadata: { path: req.originalUrl },
    }).catch(() => {})
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}

module.exports = { requireAdmin }