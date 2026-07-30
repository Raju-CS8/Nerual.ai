const mongoose = require('mongoose')

// Source of truth for "did this user actually pay." User.plan is only
// ever flipped to 'pro' after a Payment row here reaches status 'paid'
// via a signature-verified request or webhook — never on trust alone.
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // References Plan.planId (not a Mongo _id — see models/Plan.js) so
  // pricing/plan changes never require a migration here. Validity is
  // enforced in services/paymentService.js via planService, not by an
  // enum, since the set of valid plans is DB-driven and can grow.
  plan: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  // unique+sparse: a DB-level guarantee (not just an application check)
  // that the same Razorpay payment_id can never be attached to two
  // Payment documents — the last line of defense against duplicate
  // processing if a race condition ever slipped past the application-
  // level idempotency check in paymentService.confirmPayment.
  paymentId: {
    type: String,
    unique: true,
    sparse: true, // most rows start with paymentId: null before payment completes
    default: null,
  },
  signature: {
    type: String,
    default: null,
    select: false, // never returned by default queries — internal verification artifact only
  },
  amount: {
    type: Number, // paise, snapshotted from Plan.priceInPaise at purchase time
    required: true,
    min: 1,
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
    required: true,
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true, // only set once status becomes 'paid'
  },
  failureReason: {
    type: String,
    default: null,
  },
}, { timestamps: true })

// Compound index — billing history and duplicate-payment checks both
// filter by user + status, so this covers the hot query path.
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('Payment', paymentSchema)