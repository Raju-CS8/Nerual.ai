const mongoose = require('mongoose')

// Pricing lives here, not in code. Change a price by updating this
// collection (directly, via a script, or later via the Admin Dashboard)
// — no redeploy needed. planId is a stable slug ('free', 'pro', ...)
// that the rest of the app references; it is NOT the Mongo _id, so
// re-seeding or re-creating a document never breaks existing references.
const planSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  priceInPaise: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
  },
  // 'lifetime' = pay once, Pro forever (current model).
  // 'monthly' is reserved for future use — adding recurring plans later
  // won't require a schema migration, just a new Plan document.
  billingCycle: {
    type: String,
    enum: ['lifetime', 'monthly', 'free'],
    required: true,
  },
  features: {
    type: [String],
    default: [],
  },
  // Monthly AI token cap for this plan. null = unlimited (Pro).
  // Read by middleware/checkUsageLimit.js — the actual number lives
  // here, not hardcoded in any controller or frontend page.
  tokenLimit: {
    type: Number,
    default: null,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, { timestamps: true })

module.exports = mongoose.model('Plan', planSchema)