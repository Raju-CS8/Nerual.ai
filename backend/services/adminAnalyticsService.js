// services/adminAnalyticsService.js
const Payment = require('../models/Payment')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')

// ── Top-line numbers for the dashboard header cards ────────────────
const getOverview = async () => {
  const [revenueAgg, failedPaymentsCount, activeProUsers, totalUsers] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalPaidTransactions: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: 'failed' }),
    User.countDocuments({ plan: 'pro' }),
    User.countDocuments({}),
  ])

  const totalRevenuePaise = revenueAgg[0]?.totalRevenue || 0
  const totalPaidTransactions = revenueAgg[0]?.totalPaidTransactions || 0

  return {
    totalRevenuePaise,
    totalPaidTransactions,
    failedPaymentsCount,
    activeProUsers,
    totalUsers,
    // % of all users who have ever converted to Pro (lifetime plan, so
    // this doubles as a simple "conversion rate" — there's no churn to
    // net out since Pro here doesn't expire).
    conversionRatePercent: totalUsers > 0 ? Number(((activeProUsers / totalUsers) * 100).toFixed(1)) : 0,
    // Average revenue per paying user — standard ARPU-on-payers metric.
    arpuPaise: totalPaidTransactions > 0 ? Math.round(totalRevenuePaise / totalPaidTransactions) : 0,
    // Of all payment ATTEMPTS (paid + failed), what fraction failed.
    // Deliberately excludes 'created' (still-pending) rows — those
    // haven't succeeded OR failed yet, so counting them would understate
    // the rate while a checkout is mid-flight.
    failedPaymentRatePercent: (totalPaidTransactions + failedPaymentsCount) > 0
      ? Number(((failedPaymentsCount / (totalPaidTransactions + failedPaymentsCount)) * 100).toFixed(1))
      : 0,
    // Churn rate is intentionally not calculated: Pro here is a one-time
    // lifetime purchase with no renewal/expiry (confirmed design — see
    // Phase 1 notes), so there is no recurring-billing cycle for a user
    // to "churn" out of. A churn number would have to be fabricated
    // against a subscription model this app doesn't have.
  }
}

// ── Revenue trend for the last N days, zero-filled so the chart never
// has gaps for days with no payments. Same shape/reasoning as
// getMonthlyRevenue below, just at daily granularity.
const getDailyRevenue = async (daysBack = 30) => {
  const since = new Date()
  since.setDate(since.getDate() - (daysBack - 1))
  since.setHours(0, 0, 0, 0)

  const results = await Payment.aggregate([
    { $match: { status: 'paid', createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        revenuePaise: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
  ])

  const days = []
  const cursor = new Date(since)
  for (let i = 0; i < daysBack; i++) {
    days.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1, day: cursor.getDate() })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days.map(({ year, month, day }) => {
    const match = results.find(r => r._id.year === year && r._id.month === month && r._id.day === day)
    const label = new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return {
      label,
      revenuePaise: match?.revenuePaise || 0,
      transactions: match?.transactions || 0,
    }
  })
}

// ── Revenue trend for the last N months, zero-filled so the chart ──
// never has gaps for months with no payments.
const getMonthlyRevenue = async (monthsBack = 6) => {
  const since = new Date()
  since.setMonth(since.getMonth() - (monthsBack - 1))
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const results = await Payment.aggregate([
    { $match: { status: 'paid', createdAt: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenuePaise: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
  ])

  // Build the full month list first (so empty months show as 0, not missing)
  const months = []
  const cursor = new Date(since)
  for (let i = 0; i < monthsBack; i++) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return months.map(({ year, month }) => {
    const match = results.find(r => r._id.year === year && r._id.month === month)
    return {
      label: `${monthNames[month - 1]} ${year}`,
      revenuePaise: match?.revenuePaise || 0,
      transactions: match?.transactions || 0,
    }
  })
}

// ── Recent transactions list (paid or failed) with user info joined ──
const getTransactions = async ({ status = 'paid', limit = 20, page = 1 } = {}) => {
  const query = status === 'all' ? {} : { status }
  const skip = (Math.max(page, 1) - 1) * limit

  const [transactions, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .select('-__v'),
    Payment.countDocuments(query),
  ])

  return { transactions, total, page: Math.max(page, 1), totalPages: Math.ceil(total / limit) }
}

// ── Audit trail (paginated) — who did what, from where, when ──────
const getAuditLogs = async ({ eventType = 'all', limit = 30, page = 1 } = {}) => {
  const query = eventType === 'all' ? {} : { eventType }
  const skip = (Math.max(page, 1) - 1) * limit

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    AuditLog.countDocuments(query),
  ])

  return { logs, total, page: Math.max(page, 1), totalPages: Math.ceil(total / limit) }
}

module.exports = { getOverview, getMonthlyRevenue, getDailyRevenue, getTransactions, getAuditLogs }