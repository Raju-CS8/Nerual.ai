const express = require('express')
const router = express.Router()
const { sendMessage, getChats, getChat, getUsageStats, getUsageSummary, renameChat, deleteChat } = require('../controllers/chatController')
const { protect } = require('../middleware/authMiddleware')
const { checkUsageLimit } = require('../middleware/checkUsageLimit')

router.post('/', protect, checkUsageLimit, sendMessage)
router.get('/history', protect, getChats)
router.get('/stats', protect, getUsageStats)
router.get('/usage-summary', protect, getUsageSummary)
router.patch('/:id/rename', protect, renameChat)
router.delete('/:id', protect, deleteChat)
router.get('/:id', protect, getChat)

module.exports = router