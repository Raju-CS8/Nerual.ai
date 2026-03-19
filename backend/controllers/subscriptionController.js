// controllers/subscriptionController.js
const User = require('../models/User')

// Upgrade user to Pro
const upgradeToPro = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        plan: 'pro',
        tokensUsed: 0 // reset tokens on upgrade
      },
      { new: true }
    ).select('-password')

    res.json({
      success: true,
      message: 'Successfully upgraded to Pro!',
      user
    })
  } catch (error) {
    res.status(500).json({ error: 'Upgrade failed' })
  }
}

// Downgrade to Free
const downgradeToFree = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { plan: 'free' },
      { new: true }
    ).select('-password')

    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ error: 'Downgrade failed' })
  }
}

module.exports = { upgradeToPro, downgradeToFree }