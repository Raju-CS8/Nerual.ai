const mongoose = require('mongoose')

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // stored as "2026-03-19"
    required: true
  },
  tokensUsed: { type: Number, default: 0 },
  messagesCount: { type: Number, default: 0 },
  documentsCount: { type: Number, default: 0 },
}, { timestamps: true })

// One record per user per day
usageSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Usage', usageSchema)