// controllers/adminController.js
const adminAnalyticsService = require('../services/adminAnalyticsService')
const logger = require('../utils/logger')

const getOverview = async (req, res) => {
  try {
    const overview = await adminAnalyticsService.getOverview()
    res.status(200).json({ success: true, overview })
  } catch (error) {
    logger.error('admin_get_overview_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load billing overview' })
  }
}

const getRevenueChart = async (req, res) => {
  try {
    // Clamp to a sane range — never trust a client-supplied number
    // directly into a date-math loop.
    const requested = parseInt(req.query.months, 10)
    const monthsBack = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 24) : 6

    const chart = await adminAnalyticsService.getMonthlyRevenue(monthsBack)
    res.status(200).json({ success: true, chart })
  } catch (error) {
    logger.error('admin_get_revenue_chart_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load revenue chart' })
  }
}

const getDailyRevenueChart = async (req, res) => {
  try {
    const requested = parseInt(req.query.days, 10)
    const daysBack = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 90) : 30

    const chart = await adminAnalyticsService.getDailyRevenue(daysBack)
    res.status(200).json({ success: true, chart })
  } catch (error) {
    logger.error('admin_get_daily_revenue_chart_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load daily revenue chart' })
  }
}

const getTransactions = async (req, res) => {
  try {
    const allowedStatuses = ['paid', 'failed', 'all']
    const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'paid'

    const requestedLimit = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20

    const requestedPage = parseInt(req.query.page, 10)
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1

    const result = await adminAnalyticsService.getTransactions({ status, limit, page })
    res.status(200).json({ success: true, ...result })
  } catch (error) {
    logger.error('admin_get_transactions_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load transactions' })
  }
}

const getAuditLogs = async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 30

    const requestedPage = parseInt(req.query.page, 10)
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1

    const eventType = typeof req.query.eventType === 'string' ? req.query.eventType : 'all'

    const result = await adminAnalyticsService.getAuditLogs({ eventType, limit, page })
    res.status(200).json({ success: true, ...result })
  } catch (error) {
    logger.error('admin_get_audit_logs_failed', { error: error.message })
    res.status(500).json({ error: 'Could not load audit logs' })
  }
}

module.exports = { getOverview, getRevenueChart, getDailyRevenueChart, getTransactions, getAuditLogs }