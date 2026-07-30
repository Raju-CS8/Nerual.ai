// routes/adminRoutes.js
const express = require('express')
const router = express.Router()
const {
  getOverview,
  getRevenueChart,
  getDailyRevenueChart,
  getTransactions,
  getAuditLogs,
} = require('../controllers/adminController')
const { protect } = require('../middleware/authMiddleware')
const { requireAdmin } = require('../middleware/requireAdmin')

// Every route here requires a valid JWT AND isAdmin === true.
router.get('/overview', protect, requireAdmin, getOverview)
router.get('/revenue-chart', protect, requireAdmin, getRevenueChart)
router.get('/daily-revenue-chart', protect, requireAdmin, getDailyRevenueChart)
router.get('/transactions', protect, requireAdmin, getTransactions)
router.get('/audit-logs', protect, requireAdmin, getAuditLogs)

module.exports = router