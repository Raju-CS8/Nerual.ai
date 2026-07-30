const Razorpay = require('razorpay')

// Fail fast at boot if credentials are missing, instead of failing
// silently the first time someone tries to pay.
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']
const missing = requiredEnvVars.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.warn(
    `⚠️  Razorpay env vars missing: ${missing.join(', ')} — payment routes will fail until these are set.`
  )
}

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

module.exports = { razorpayClient }