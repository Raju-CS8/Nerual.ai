// routes/authRoutes.js
// Auth route definitions

const express = require('express')
const router = express.Router()
const { signup, login, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', protect, getMe)   // protected — needs valid JWT

module.exports = router