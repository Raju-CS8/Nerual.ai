const { body, param, validationResult } = require('express-validator')

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request', details: errors.array() })
  }
  next()
}

const validateCreateOrder = [
  // planId is optional (defaults to 'pro' in the controller) — but if
  // sent, it must be a plain slug string. Existence/activeness of the
  // plan itself is checked against the DB in paymentService, not here.
  body('planId')
    .optional()
    .isString().withMessage('planId must be a string')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('planId is invalid')
    .matches(/^[a-z0-9_-]+$/i).withMessage('planId contains invalid characters'),
  handleValidation,
]

const validateVerifyPayment = [
  body('razorpay_order_id').isString().trim().notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').isString().trim().notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').isString().trim().notEmpty().withMessage('razorpay_signature is required'),
  handleValidation,
]

const validateTransactionIdParam = [
  param('transactionId').isMongoId().withMessage('Invalid transaction id'),
  handleValidation,
]

module.exports = { validateCreateOrder, validateVerifyPayment, validateTransactionIdParam }