const express = require('express')
const router = express.Router()
const {
  getPlans,
  createOrder,
  verifyPayment,
  razorpayWebhook,
  downgradeToFree,
  getTransactions,
  downloadReceipt,
} = require('../controllers/subscriptionController')
const { protect } = require('../middleware/authMiddleware')
const {
  validateCreateOrder,
  validateVerifyPayment,
  validateTransactionIdParam,
} = require('../middleware/validatePayment')

// Public — pricing page needs this before/without login, and prices are
// DB-driven (models/Plan.js) so the frontend never hardcodes a ₹ figure.
router.get('/plans', getPlans)

// Authenticated — normal app flow
router.post('/create-order', protect, validateCreateOrder, createOrder)
router.post('/verify-payment', protect, validateVerifyPayment, verifyPayment)
router.post('/downgrade', protect, downgradeToFree)
router.get('/transactions', protect, getTransactions)
router.get('/receipt/:transactionId', protect, validateTransactionIdParam, downloadReceipt)

// NOT authenticated with JWT — called by Razorpay's servers directly.
// Protected instead by verifying X-Razorpay-Signature against
// RAZORPAY_WEBHOOK_SECRET inside the controller/service.
router.post('/webhook', razorpayWebhook)

module.exports = router