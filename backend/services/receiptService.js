// Streams a simple PDF payment receipt directly to the HTTP response.
// Kept synchronous/fire-and-forget on purpose -- controllers/
// subscriptionController.js's downloadReceipt calls this without
// awaiting, since PDFDocument pipes to `res` itself and manages the
// response lifecycle (res.end() is called when the doc finishes).
const PDFDocument = require('pdfkit')

const formatAmount = (amountInPaise, currency = 'INR') =>
  `${currency} ${(amountInPaise / 100).toFixed(2)}`

// payment: a Payment document (see models/Payment.js) -- status
// 'paid', with paymentId/receiptNumber already set by paymentService.
// user: the User document who made the payment.
const streamReceiptPDF = (res, { payment, user }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="NeuralIQ-Receipt-${payment.receiptNumber || payment._id}.pdf"`
  )

  doc.pipe(res)

  doc
    .fontSize(20)
    .text('NeuralIQ', { align: 'left' })
    .fontSize(10)
    .fillColor('#666666')
    .text('AI-Powered Real-Time Collaborative Workspace', { align: 'left' })
    .moveDown(1.5)

  doc
    .fillColor('#000000')
    .fontSize(16)
    .text('Payment Receipt', { align: 'left' })
    .moveDown(1)

  const rows = [
    ['Receipt Number', payment.receiptNumber || '--'],
    ['Date', new Date(payment.createdAt).toLocaleString('en-IN')],
    ['Billed To', `${user?.name || '--'} (${user?.email || '--'})`],
    ['Plan', payment.plan ? payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1) : '--'],
    ['Order ID', payment.orderId || '--'],
    ['Payment ID', payment.paymentId || '--'],
    ['Amount Paid', formatAmount(payment.amount, payment.currency)],
    ['Status', 'Paid'],
  ]

  doc.fontSize(11)
  rows.forEach(([label, value]) => {
    doc
      .fillColor('#666666')
      .text(label, { continued: true, width: 150 })
      .fillColor('#000000')
      .text(`   ${value}`)
    doc.moveDown(0.4)
  })

  doc
    .moveDown(2)
    .fontSize(9)
    .fillColor('#999999')
    .text('This is a computer-generated receipt and does not require a signature.', {
      align: 'left',
    })

  doc.end()
}

module.exports = { streamReceiptPDF }