const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')

const router = express.Router()

// 🔹 Step 1: Redirect to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// 🔹 Step 2: Callback from Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://nerual-ai.vercel.app/login' }),
  (req, res) => {

    // 🔥 Generate JWT (same style as your auth system)
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    // 🔥 Redirect to frontend with token
    res.redirect(`https://nerual-ai.vercel.app/dashboard?token=${token}`)
  }
)

module.exports = router