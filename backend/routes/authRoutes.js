const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { signup, login, getMe, uploadAvatar, updateName } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

// ✅ Memory storage — no disk needed on Render
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only images allowed'))
  }
})

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', protect, getMe)
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar)
router.patch('/name', protect, updateName)

module.exports = router