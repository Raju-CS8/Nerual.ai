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
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        plan: user.plan,
        tokensUsed: user.tokensUsed,
        documentsProcessed: user.documentsProcessed,
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Server error during signup', details: error.message })
  }
}

// LOGIN
const login = async (req, res) => {
  try {
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
        avatar: user.avatar || null,
        plan: user.plan,
        tokensUsed: user.tokensUsed,
        documentsProcessed: user.documentsProcessed,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
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

// ✅ UPLOAD AVATAR
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const fs = require('fs')
    const filePath = req.file.path

    const fileBuffer = fs.readFileSync(filePath)
    const base64 = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: base64 },
      { new: true }
    ).select('-password')

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        tokensUsed: user.tokensUsed,
        documentsProcessed: user.documentsProcessed,
      }
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({ error: 'Avatar upload failed' })
  }
}

module.exports = { signup, login, getMe, uploadAvatar }