const express = require('express')
const router = express.Router()
const { sendMessage, getChats, getChat, getUsageStats } = require('../controllers/chatController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, sendMessage)
router.get('/history', protect, getChats)
router.get('/stats', protect, getUsageStats)
router.get('/:id', protect, getChat)

module.exports = router