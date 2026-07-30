// backend/scripts/seedPlans.js
//
// Idempotent seeder for the Plan collection. Uses $setOnInsert so it
// only ever CREATES a plan that doesn't exist yet — it will never
// overwrite a price you've since changed directly in the database
// (or, later, via the Admin Dashboard). Safe to run on every deploy.
//
// Usage:
//   node scripts/seedPlans.js          (standalone, connects + disconnects)
//   require('./seedPlans').seedPlans() (called from server.js on boot)

const mongoose = require('mongoose')
const Plan = require('../models/Plan')

const DEFAULT_PLANS = [
  {
    planId: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    priceInPaise: 0,
    currency: 'INR',
    billingCycle: 'free',
    tokenLimit: 100000,
    features: [
      '1,00,000 tokens/month',
      '10 file uploads',
      'Basic AI chat (LLaMA)',
      'PDF summarization',
      'Chat history',
      'Community support',
    ],
    sortOrder: 0,
  },
  {
    planId: 'pro',
    name: 'Pro',
    description: 'For power users & teams',
    priceInPaise: 9900, // ₹99.00 — change here (or in the DB directly) any time, no redeploy needed
    currency: 'INR',
    billingCycle: 'lifetime',
    tokenLimit: null, // unlimited
    features: [
      'Unlimited tokens',
      'Unlimited file uploads',
      'Advanced LLaMA AI (2x response length)',
      'Advanced PDF analysis',
      'Full chat history',
      'Priority support',
      'Early access to new features',
      'Lifetime access — pay once, no renewals',
    ],
    sortOrder: 1,
  },
]

const seedPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate(
      { planId: plan.planId },
      { $setOnInsert: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }
  console.log('✅ Plan collection seeded (existing plans left untouched)')
}

// Allow running standalone: `node scripts/seedPlans.js`
if (require.main === module) {
  require('dotenv').config()
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedPlans()
      await mongoose.disconnect()
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seeding failed:', err)
      process.exit(1)
    })
}

module.exports = { seedPlans, DEFAULT_PLANS }