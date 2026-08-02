// controllers/subscriptionController.js
// Thin HTTP layer — all business logic lives in services/paymentService.js,
// services/planService.js, and services/receiptService.js. This file only:
// reads the request, calls a service, and shapes the HTTP response — plus,
// as of Phase 4, captures request context (IP/user-agent) for audit
// logging, since that's HTTP-layer information the services deliberately
// don't depend on (keeps them request-agnostic and easier to test).
const User = require('../models/User')
const Payment = require('../models/Payment')
const paymentService = require('../services/paymentService')
const planService = require('../services/planService')
const receiptService = require('../services/receiptService')
const auditLogService = require('../services/auditLogService')
const logger = require('../utils/logger')
const { RAZORPAY_KEY_ID } = require('../config/razorpay')

// Small helper — every audit log call needs the same two fields pulled
// off the request. req.ip requires `app.set('trust proxy', 1)`, already
// set in server.js, so this reflects the real client IP behind Render's
// proxy, not Render's internal load balancer IP.
const reqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'] || null,
})

// ── Public pricing list (DB-driven, no auth required) ─────────────
// Used by the Pricing page so prices/features are never hardcoded
// into the frontend build — change a Plan document, page reflects it
// on next load, no redeploy.
const getPlans = async (req, res) => {
  try {
    const plans = await planService.getActivePlans()
    res.status(200).json({ success: true, plans })
  } catch (error) {
    logger.error('get_plans_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load plans' })
  }
}

// ── STEP 1: Create a Razorpay order ────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // planId is optional and defaults to 'pro' for backward compatibility
    // with the existing frontend call (which sends no body). Validated
    // against the Plan collection inside the service, never trusted as-is.
    const planId = req.body?.planId || 'pro'
    const order = await paymentService.createOrderForUser(user, planId)

    // Instant reactivation path — no Razorpay order was created, so
    // the frontend must NOT try to open checkout with this response.
    // Distinguished by `alreadyPurchased` rather than the presence/
    // absence of `orderId`, so the frontend's branch is explicit
    // instead of inferred.
    if (order.alreadyPurchased) {
      auditLogService.logEvent('lifetime_plan_reactivated', {
        userId: user._id,
        ...reqContext(req),
        metadata: { planId, receiptNumber: order.receiptNumber },
      })

      return res.status(200).json({
        success: true,
        alreadyPurchased: true,
        message: order.message,
        user: { name: order.user.name, email: order.user.email, plan: order.user.plan },
      })
    }

    auditLogService.logEvent('order_created', {
      userId: user._id,
      ...reqContext(req),
      metadata: { orderId: order.orderId, amount: order.amount, planId },
    })

    // Only the PUBLIC key_id goes to the frontend — never key_secret.
    res.status(201).json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      user: { name: user.name, email: user.email },
    })
  } catch (error) {
    logger.error('create_order_failed', { userId: req.user?.id, error: error.message })
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Could not create payment order. Please try again.' })
  }
}

// ── STEP 2: Verify payment signature and activate the plan ────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const result = await paymentService.confirmPayment(req.user.id, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    auditLogService.logEvent('payment_verified', {
      userId: req.user.id,
      paymentId: result.payment._id,
      ...reqContext(req),
      metadata: { alreadyProcessed: result.alreadyProcessed, orderId: razorpay_order_id },
    })

    res.status(200).json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified — Pro plan activated for life!',
      user: result.user,
      transactionId: result.payment._id,
      receiptNumber: result.payment.receiptNumber,
    })
  } catch (error) {
    logger.error('verify_payment_failed', { userId: req.user?.id, error: error.message })
    auditLogService.logEvent('payment_verification_failed', {
      userId: req.user?.id,
      ...reqContext(req),
      metadata: { orderId: req.body?.razorpay_order_id, reason: error.message },
    })
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Payment verification failed. Please contact support.' })
  }
}

// ── STEP 3 (backup path): Razorpay webhook ─────────────────────────
// Server-to-server notification — activates the plan even if the user
// closes the tab right after paying. Auth is the signature check, not JWT.
//
// Retry semantics matter here: Razorpay retries webhook deliveries that
// don't get a 2xx response. We return 400 for a bad signature (that
// won't fix itself on retry — Razorpay's own docs say stop retrying on
// 4xx) and 500 only for genuine transient failures (e.g. DB hiccup),
// which SHOULD be retried. Never return anything but 200 once an event
// has actually been processed or already-processed.
const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const rawBody = req.rawBody

    if (!signature || !rawBody) {
      return res.status(400).json({ error: 'Missing webhook signature' })
    }

    const isValid = paymentService.verifyWebhookSignature(rawBody, signature)
    if (!isValid) {
      logger.warn('webhook_signature_invalid', { ...reqContext(req) })
      auditLogService.logEvent('webhook_signature_invalid', { ...reqContext(req) })
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    auditLogService.logEvent('webhook_received', {
      ...reqContext(req),
      metadata: { event: req.body?.event },
    })

    const outcome = await paymentService.handleWebhookEvent(req.body)

    if (outcome === 'duplicate_ignored') {
      auditLogService.logEvent('webhook_duplicate_ignored', {
        ...reqContext(req),
        metadata: { event: req.body?.event },
      })
    }

    // Always 200 once verified + processed (including duplicates —
    // that's a correct, already-handled outcome, not an error), so
    // Razorpay stops retrying.
    res.status(200).json({ received: true, outcome })
  } catch (error) {
    logger.error('webhook_processing_failed', { error: error.message })
    // 500 here is intentional — this is exactly the case that SHOULD
    // trigger a Razorpay retry (something transient broke on our end).
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

// ── Downgrade to Free ───────────────────────────────────────────────
// Note: this is still user-initiated (self-service). Restricting it to
// admin-only is a Phase 3 concern (once roles/admin auth exist) — not
// changed here to avoid touching auth behavior outside this phase's scope.
const downgradeToFree = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { plan: 'free' }, { new: true }).select('-password')
    auditLogService.logEvent('downgrade_to_free', { userId: req.user.id, ...reqContext(req) })
    res.status(200).json({ success: true, user })
  } catch (error) {
    logger.error('downgrade_failed', { userId: req.user?.id, error: error.message })
    res.status(500).json({ error: 'Downgrade failed' })
  }
}

// ── Billing history ──────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find({ userId: req.user.id, status: 'paid' }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, transactions })
  } catch (error) {
    res.status(500).json({ error: 'Could not load billing history' })
  }
}

// ── Downloadable PDF receipt ─────────────────────────────────────
const downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.transactionId,
      userId: req.user.id,
      status: 'paid',
    })
    if (!payment) return res.status(404).json({ error: 'Receipt not found' })

    const user = await User.findById(req.user.id)
    receiptService.streamReceiptPDF(res, { payment, user })
  } catch (error) {
    logger.error('download_receipt_failed', { userId: req.user?.id, error: error.message })
    res.status(500).json({ error: 'Could not generate receipt' })
  }
}

module.exports = {
  getPlans,
  createOrder,
  verifyPayment,
  razorpayWebhook,
  downgradeToFree,
  getTransactions,
  downloadReceipt,
}