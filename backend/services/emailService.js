// services/emailService.js
const nodemailer = require('nodemailer')
const logger = require('../utils/logger')

// Generic SMTP transport — works with Gmail (app password), Brevo,
// SendGrid's SMTP relay, or any other provider by just changing env
// vars. Not locked to one vendor's SDK.
let transporter = null
const getTransporter = () => {
  if (transporter) return transporter

  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    logger.warn('email_env_vars_missing', { missing })
    return null
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for 587/others
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
  return transporter
}

const brandHeader = `
  <div style="font-family: sans-serif; padding: 24px; background: #0B1510; color: #C5A059;">
    <h2 style="margin: 0; letter-spacing: 0.02em;">NEURALIQ.</h2>
  </div>
`

// Never throw — a failed email should never break the payment flow that
// triggered it. Callers fire-and-forget this (see paymentService.js).
const sendPaymentSuccessEmail = async ({ to, name, amount, currency, receiptNumber, planName }) => {
  const t = getTransporter()
  if (!t) return

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Payment successful — NeuralIQ Pro is active 🎉',
      html: `
        ${brandHeader}
        <div style="padding: 24px; font-family: sans-serif; color: #222;">
          <p>Hi ${name},</p>
          <p>Your payment of <strong>${currency} ${(amount / 100).toFixed(2)}</strong> for <strong>${planName}</strong> was successful, and your account is now upgraded — permanently, no renewals needed.</p>
          <p style="color: #666; font-size: 13px;">Receipt: ${receiptNumber}</p>
          <p>You can download the full PDF receipt any time from the Pricing page in your dashboard.</p>
          <p>— The NeuralIQ Team</p>
        </div>
      `,
    })
    logger.info('payment_success_email_sent', { to })
  } catch (error) {
    logger.error('payment_success_email_failed', { to, error: error.message })
  }
}

const sendPaymentFailedEmail = async ({ to, name, reason }) => {
  const t = getTransporter()
  if (!t) return

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Payment failed — NeuralIQ',
      html: `
        ${brandHeader}
        <div style="padding: 24px; font-family: sans-serif; color: #222;">
          <p>Hi ${name},</p>
          <p>Your recent payment to upgrade to NeuralIQ Pro didn't go through.</p>
          <p style="color: #666; font-size: 13px;">Reason: ${reason || 'Payment could not be verified'}</p>
          <p>No amount was charged for this attempt. If money was deducted from your account, it will be automatically refunded by Razorpay within a few business days. You can try upgrading again any time from the Pricing page.</p>
          <p>— The NeuralIQ Team</p>
        </div>
      `,
    })
    logger.info('payment_failed_email_sent', { to })
  } catch (error) {
    logger.error('payment_failed_email_failed', { to, error: error.message })
  }
}

module.exports = { sendPaymentSuccessEmail, sendPaymentFailedEmail }