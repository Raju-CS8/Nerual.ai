const Razorpay = require('razorpay')

// Warn at boot if credentials are missing, but DON'T construct the
// Razorpay client here — the SDK throws synchronously in its
// constructor when key_id/key_secret are missing or malformed, and
// since this file is require()'d from server.js at startup, that
// throw was taking down the entire process (not just payment routes)
// any time these env vars weren't set on the deploy target. Render
// then silently kept serving the previous successful build, which
// made this look like a routing/deployment bug instead of a crash.
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']
const missing = requiredEnvVars.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.warn(
    `⚠️  Razorpay env vars missing: ${missing.join(', ')} — payment routes will fail until these are set.`
  )
}

let _client = null

// Constructed lazily, on first actual use (i.e. when someone hits
// create-order) — not at require time. If credentials are missing,
// this throws a normal catchable Error inside that one request's
// try/catch instead of crashing the whole server at boot.
const getRazorpayClient = () => {
  if (_client) return _client

  if (missing.length > 0) {
    const err = new Error(
      `Razorpay is not configured — missing env vars: ${missing.join(', ')}`
    )
    err.statusCode = 503
    throw err
  }

  _client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  return _client
}

module.exports = { getRazorpayClient }