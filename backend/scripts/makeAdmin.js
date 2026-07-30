// backend/scripts/makeAdmin.js
//
// Grants (or revokes) admin access for the Admin Billing Dashboard.
// Deliberately a CLI script, not an API route — isAdmin should never
// be settable by any authenticated request, only by someone with
// direct access to the server/deployment.
//
// Usage:
//   node scripts/makeAdmin.js user@example.com          (grant)
//   node scripts/makeAdmin.js user@example.com --revoke  (revoke)

require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const run = async () => {
  const email = process.argv[2]
  const revoke = process.argv.includes('--revoke')

  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js user@example.com [--revoke]')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { isAdmin: !revoke },
    { new: true }
  ).select('name email isAdmin')

  if (!user) {
    console.error(`No user found with email: ${email}`)
    await mongoose.disconnect()
    process.exit(1)
  }

  console.log(`✅ ${user.email} (${user.name}) — isAdmin: ${user.isAdmin}`)
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('makeAdmin failed:', err)
  process.exit(1)
})