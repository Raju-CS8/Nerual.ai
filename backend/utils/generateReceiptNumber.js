// Generates a unique, human-readable receipt number for a paid
// Payment document. Payment.receiptNumber has a unique+sparse index
// (see models/Payment.js), so this needs enough entropy to make
// collisions practically impossible even under concurrent webhook +
// checkout-callback calls confirming the same payment (paymentService
// calls this from both confirmPayment and the webhook handler).
//
// Format: RCPT-<YYYYMMDD>-<6 random uppercase alphanumeric chars>
// e.g. RCPT-20260801-K3F9QZ
//
// Not cryptographically sensitive -- this is a display/reference
// number, not a security token, so Math.random() is fine here.
const generateReceiptNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I -- avoids visual ambiguity on a receipt
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }

  return `RCPT-${datePart}-${randomPart}`
}

module.exports = { generateReceiptNumber }