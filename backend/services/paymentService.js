const crypto = require('crypto')
const { getRazorpayClient, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = require('../config/razorpay')
const Payment = require('../models/Payment')
const User = require('../models/User')
const planService = require('./planService')
const emailService = require('./emailService')
const { generateReceiptNumber } = require('../utils/generateReceiptNumber')

// ── Create a Razorpay order + local Payment record ────────────────
// Pricing is read from the Plan collection (DB-driven, see models/Plan.js)
// — never trust a client-supplied amount, and never hardcode one here either.
const createOrderForUser = async (user, planId = 'pro') => {
  const plan = await planService.getPlanById(planId)
  if (!plan) {
    const err = new Error(`Unknown or inactive plan: ${planId}`)
    err.statusCode = 400
    throw err
  }

  if (user.plan === plan.planId) {
    const err = new Error(`You already have lifetime access to the ${plan.name} plan — no need to pay again.`)
    err.statusCode = 400
    err.code = 'ALREADY_ON_PLAN'
    throw err
  }

  // Lifetime-purchase check: 'pro' is a one-time payment, not a
  // subscription (see Plan.billingCycle === 'lifetime'), so a user
  // who previously paid and later called downgradeToFree still owns
  // Pro forever. Re-upgrading should never charge them a second time
  // — instead of creating a Razorpay order, flip their plan straight
  // back to 'pro' using the original paid Payment record as proof of
  // purchase. Only applies to plans whose billing cycle is lifetime;
  // a future subscription-based plan wouldn't hit this branch since
  // its billingCycle would be something like 'monthly'.
  if (plan.billingCycle === 'lifetime') {
    const priorPurchase = await Payment.findOne({
      userId: user._id,
      plan: plan.planId,
      status: 'paid',
    }).sort({ createdAt: -1 })

    if (priorPurchase) {
      const reactivatedUser = await User.findByIdAndUpdate(
        user._id,
        { plan: plan.planId },
        { new: true }
      ).select('-password')

      return {
        alreadyPurchased: true,
        user: reactivatedUser,
        receiptNumber: priorPurchase.receiptNumber,
        message: `Welcome back! You already own lifetime ${plan.name} access from your ${new Date(priorPurchase.createdAt).toLocaleDateString('en-IN')} purchase — reactivated instantly, no payment needed.`,
      }
    }
  }

  // Prevent stacking duplicate pending orders — reuse an existing
  // unpaid order for this user/plan if one was created in the last hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const existingPending = await Payment.findOne({
    userId: user._id,
    plan: plan.planId,
    status: 'created',
    createdAt: { $gte: oneHourAgo },
  })
  if (existingPending) {
    return {
      orderId: existingPending.orderId,
      amount: existingPending.amount,
      currency: existingPending.currency,
    }
  }

  // Snapshot the price at purchase time onto the order/payment record —
  // if the Plan's price changes later, past receipts still show what
  // was actually charged, not today's price.
  const order = await getRazorpayClient().orders.create({
    amount: plan.priceInPaise,
    currency: plan.currency,
    receipt: `order_rcpt_${Date.now()}`,
    notes: { userId: user._id.toString(), plan: plan.planId },
  })

  await Payment.create({
    userId: user._id,
    plan: plan.planId,
    orderId: order.id,
    amount: plan.priceInPaise,
    currency: plan.currency,
    status: 'created',
  })

  return { orderId: order.id, amount: order.amount, currency: order.currency }
}

// ── Verify HMAC SHA256 signature from Razorpay Checkout callback ──
const verifySignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// ── Verify HMAC SHA256 signature on a raw webhook payload ─────────
const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// ── Confirm a payment (from Checkout callback) and activate the plan ──
// Returns { alreadyProcessed, payment, user }. Throws with statusCode on failure.
const confirmPayment = async (userId, { orderId, paymentId, signature }) => {
  const payment = await Payment.findOne({ orderId, userId })
  if (!payment) {
    const err = new Error('Order not found for this user')
    err.statusCode = 404
    throw err
  }

  if (payment.status === 'paid') {
    return { alreadyProcessed: true, payment, user: await User.findById(userId).select('-password') }
  }

  const isValid = verifySignature(orderId, paymentId, signature)
  if (!isValid) {
    payment.status = 'failed'
    payment.failureReason = 'Signature verification failed'
    await payment.save()

    // Fire-and-forget — do not await into the request/response path.
    User.findById(userId).select('name email').then((u) => {
      if (u) emailService.sendPaymentFailedEmail({ to: u.email, name: u.name, reason: payment.failureReason })
    }).catch(() => {})

    const err = new Error('Payment verification failed. If money was deducted, it will be auto-refunded by Razorpay.')
    err.statusCode = 400
    throw err
  }

  payment.paymentId = paymentId
  payment.signature = signature
  payment.status = 'paid'
  payment.receiptNumber = generateReceiptNumber()
  await payment.save()

  const user = await User.findByIdAndUpdate(userId, { plan: payment.plan }, { new: true }).select('-password')

  // Fire-and-forget — same reasoning as above.
  planService.getPlanById(payment.plan).then((plan) => {
    emailService.sendPaymentSuccessEmail({
      to: user.email,
      name: user.name,
      amount: payment.amount,
      currency: payment.currency,
      receiptNumber: payment.receiptNumber,
      planName: plan?.name || payment.plan,
    })
  }).catch(() => {})

  return { alreadyProcessed: false, payment, user }
}

// ── Handle a verified webhook event (server-to-server backup path) ──
// Returns an outcome string so the controller can audit-log what
// actually happened: 'processed' | 'duplicate_ignored' | 'no_matching_payment' | 'ignored'.
const handleWebhookEvent = async (event) => {
  if (event.event === 'payment.captured') {
    const razorpayPayment = event.payload.payment.entity
    const payment = await Payment.findOne({ orderId: razorpayPayment.order_id })

    if (!payment) return 'no_matching_payment'

    // Already processed (most likely via the frontend's verify-payment
    // call beating the webhook here, or a retried webhook delivery) —
    // this check is what makes retries safe: same event delivered
    // twice never double-activates or double-emails.
    if (payment.status === 'paid') return 'duplicate_ignored'

    payment.paymentId = razorpayPayment.id
    payment.status = 'paid'
    payment.receiptNumber = payment.receiptNumber || generateReceiptNumber()
    await payment.save()

    const user = await User.findByIdAndUpdate(payment.userId, { plan: payment.plan }, { new: true })

    if (user) {
      planService.getPlanById(payment.plan).then((plan) => {
        emailService.sendPaymentSuccessEmail({
          to: user.email,
          name: user.name,
          amount: payment.amount,
          currency: payment.currency,
          receiptNumber: payment.receiptNumber,
          planName: plan?.name || payment.plan,
        })
      }).catch(() => {})
    }

    return 'processed'
  }

  if (event.event === 'payment.failed') {
    const razorpayPayment = event.payload.payment.entity
    const payment = await Payment.findOne({ orderId: razorpayPayment.order_id })

    if (!payment) return 'no_matching_payment'
    if (payment.status === 'failed' || payment.status === 'paid') return 'duplicate_ignored'

    payment.status = 'failed'
    payment.failureReason = razorpayPayment.error_description || 'Payment failed'
    await payment.save()

    const user = await User.findById(payment.userId).select('name email')
    if (user) {
      emailService.sendPaymentFailedEmail({ to: user.email, name: user.name, reason: payment.failureReason }).catch(() => {})
    }

    return 'processed'
  }

  return 'ignored'
}

module.exports = {
  createOrderForUser,
  confirmPayment,
  verifySignature,
  verifyWebhookSignature,
  handleWebhookEvent,
}