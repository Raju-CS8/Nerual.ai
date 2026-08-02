const mongoose = require('mongoose')

// Append-only record of payment-related events, for compliance/debugging.
// Never updated after creation — each row is a fact about something that
// happened, not current state (that's what Payment/User are for).
const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'order_created',
      'payment_verified',
      'payment_verification_failed',
      'webhook_received',
      'webhook_signature_invalid',
      'webhook_duplicate_ignored',
      'downgrade_to_free',
      'lifetime_plan_reactivated',
      'admin_access_denied',
    ],
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for events with no authenticated user yet (e.g. bad webhook signature)
    index: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },
  // Captured directly from the request in the controller (services stay
  // request-agnostic/testable) — see subscriptionController.js.
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  // Free-form context specific to the event (e.g. orderId, amount,
  // failureReason). Kept as Mixed rather than a fixed schema since
  // different event types carry different details.
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true })

// Hot query paths: "show me this user's history" and "show me recent
// events of this type" (used by the admin audit log view).
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ eventType: 1, createdAt: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)