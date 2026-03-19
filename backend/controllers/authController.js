// controllers/authController.js
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

// SIGNUP
const signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body) // debug log

    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const user = await User.create({ name, email, password })
    console.log('User created:', user._id) // debug log

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        tokensUsed: user.tokensUsed,
        documentsProcessed: user.documentsProcessed,
      }
    })
  } catch (error) {
    console.error('Signup error FULL:', error) // full error log
    res.status(500).json({ error: 'Server error during signup', details: error.message })
  }
}

// LOGIN
const login = async (req, res) => {
  try {
    console.log('Login request received:', req.body)

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        tokensUsed: user.tokensUsed,
        documentsProcessed: user.documentsProcessed,
      }
    })
  } catch (error) {
    console.error('Login error FULL:', error)
    res.status(500).json({ error: 'Server error during login', details: error.message })
  }
}

// GET ME
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { signup, login, getMe }