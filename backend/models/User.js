const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    // ❗ REMOVE required → so Google users can login without password
  },

  // 🔥 GOOGLE AUTH FIELDS (NEW)
  googleId: {
    type: String,
    unique: true,
    sparse: true // allows null values for normal users
  },
  avatar: {
    type: String,
  },

  plan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  // Site-wide admin flag — gates the Admin Billing Dashboard only.
  // Unrelated to the workspace-level collaborator 'role' field used in
  // Workspace.js/roleMiddleware.js, which is a per-workspace concept.
  // Never exposed on any signup/update endpoint — only settable via
  // scripts/makeAdmin.js (a CLI script, not an API route) to keep it
  // out of reach of any client request.
  isAdmin: {
    type: Boolean,
    default: false,
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  // Resets to 0 every calendar month (see middleware/checkUsageLimit.js) —
  // this is what plan limits are actually enforced against. tokensUsed
  // above stays a lifetime running total and is left untouched, since
  // existing pages already read it for historical display.
  monthlyTokensUsed: {
    type: Number,
    default: 0,
  },
  usageResetAt: {
    type: Date,
    default: Date.now,
  },
  documentsProcessed: {
    type: Number,
    default: 0,
  },

}, { timestamps: true })

// 🔐 Hash password only if it exists
userSchema.pre('save', async function() {
  if (!this.password) return
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) return false
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)