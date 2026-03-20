// routes/fileRoutes.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { uploadAndSummarize, chatWithPDF } = require('../controllers/fileController')
const { protect } = require('../middleware/authMiddleware')

// ✅ Use memory storage — no disk needed, works on Render
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.txt', '.docx']
  const ext = path.extname(file.originalname).toLowerCase()
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, TXT, DOCX allowed'), false)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })

router.post('/upload', protect, upload.single('file'), uploadAndSummarize)
router.post('/chat', protect, chatWithPDF)

module.exports = router