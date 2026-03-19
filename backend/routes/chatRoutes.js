const express = require('express')
const router = express.Router()
const { sendMessage, getChats, getChat, getUsageStats, renameChat, deleteChat } = require('../controllers/chatController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, sendMessage)
router.get('/history', protect, getChats)
router.get('/stats', protect, getUsageStats)
router.patch('/:id/rename', protect, renameChat)
router.delete('/:id', protect, deleteChat)
router.get('/:id', protect, getChat)

module.exports = router