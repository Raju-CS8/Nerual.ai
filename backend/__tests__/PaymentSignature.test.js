const crypto = require('crypto')

// Isolated from the DB-touching parts of paymentService — set a fake
// key before requiring the module, since config/razorpay.js reads env
// vars at import time.
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_for_jest'
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_for_jest'
process.env.RAZORPAY_KEY_ID = 'rzp_test_fake_key_id'

const { verifySignature, verifyWebhookSignature } = require('../services/paymentService')

describe('paymentService signature verification', () => {

  describe('verifySignature (Checkout callback)', () => {
    it('accepts a correctly computed signature', () => {
      const orderId = 'order_ABC123'
      const paymentId = 'pay_XYZ789'
      const validSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex')

      expect(verifySignature(orderId, paymentId, validSignature)).toBe(true)
    })

    it('rejects a tampered signature', () => {
      const orderId = 'order_ABC123'
      const paymentId = 'pay_XYZ789'
      const tamperedSignature = 'a'.repeat(64) // wrong but same length

      expect(verifySignature(orderId, paymentId, tamperedSignature)).toBe(false)
    })

    it('rejects a signature computed with the wrong order/payment id (replay attempt)', () => {
      const validSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update('order_ABC123|pay_XYZ789')
        .digest('hex')

      // Same signature, but claiming it's for a different order —
      // this is exactly the kind of tampering signature verification
      // exists to catch.
      expect(verifySignature('order_DIFFERENT', 'pay_XYZ789', validSignature)).toBe(false)
    })

    it('rejects a signature of the wrong length without throwing', () => {
      expect(() => verifySignature('order_ABC123', 'pay_XYZ789', 'tooshort')).not.toThrow()
      expect(verifySignature('order_ABC123', 'pay_XYZ789', 'tooshort')).toBe(false)
    })
  })

  describe('verifyWebhookSignature (server-to-server webhook)', () => {
    it('accepts a correctly computed signature over the raw body', () => {
      const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }))
      const validSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')

      expect(verifyWebhookSignature(rawBody, validSignature)).toBe(true)
    })

    it('rejects a signature computed with the wrong secret', () => {
      const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }))
      const wrongSecretSignature = crypto
        .createHmac('sha256', 'not_the_real_webhook_secret')
        .update(rawBody)
        .digest('hex')

      expect(verifyWebhookSignature(rawBody, wrongSecretSignature)).toBe(false)
    })

    it('rejects the signature if even one byte of the body changes', () => {
      const originalBody = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 9900 }))
      const validSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(originalBody)
        .digest('hex')

      // Same signature, but the body was modified after signing —
      // e.g. someone tried to change the amount in transit.
      const tamperedBody = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 100 }))
      expect(verifyWebhookSignature(tamperedBody, validSignature)).toBe(false)
    })
  })

})