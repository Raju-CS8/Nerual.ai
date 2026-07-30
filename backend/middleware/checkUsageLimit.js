// middleware/checkUsageLimit.js
//
// Runs AFTER `protect` (needs req.user). Two jobs:
//   1. Lazily reset monthlyTokensUsed to 0 if we've crossed into a new
//      calendar month since the user's last reset — no cron job needed,
//      the check just runs on the next request of a new month.
//   2. Block the request with 403 if the user's plan has a token cap
//      and they've hit it.
//
// The actual limit number is never hardcoded here — it's read from the
// Plan collection via planService (reuses the existing service from
// Phase 1 instead of duplicating a lookup).
const User = require('../models/User')
const planService = require('../services/planService')

const isNewCalendarMonth = (lastReset) => {
  const now = new Date()
  const last = new Date(lastReset)
  return now.getFullYear() !== last.getFullYear() || now.getMonth() !== last.getMonth()
}

const checkUsageLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      // Should never happen if `protect` runs first, but fail safely
      // rather than assume.
      return res.status(401).json({ error: 'Not authorized' })
    }

    // ── Step 1: lazy monthly reset ──────────────────────────────
    if (isNewCalendarMonth(req.user.usageResetAt)) {
      req.user.monthlyTokensUsed = 0
      req.user.usageResetAt = new Date()
      await req.user.save()
    }

    // ── Step 2: look up this user's plan limit (DB-driven) ──────
    const plan = await planService.getPlanById(req.user.plan)

    if (!plan) {
      // Plan config missing/deactivated — fail open rather than break
      // the whole app for every user because of a data issue, but log
      // it loudly so it gets noticed and fixed.
      console.warn(`⚠️  checkUsageLimit: no active Plan found for planId "${req.user.plan}" — allowing request through unmetered`)
      return next()
    }

    // null/undefined tokenLimit = unlimited (e.g. Pro)
    if (plan.tokenLimit != null && req.user.monthlyTokensUsed >= plan.tokenLimit) {
      return res.status(403).json({
        error: `Monthly token limit reached (${plan.tokenLimit.toLocaleString()} tokens). Upgrade to Pro for unlimited access.`,
        limitReached: true,
        monthlyTokensUsed: req.user.monthlyTokensUsed,
        tokenLimit: plan.tokenLimit,
        resetsOn: nextResetDate(req.user.usageResetAt),
      })
    }

    next()
  } catch (error) {
    console.error('checkUsageLimit error:', error.message)
    res.status(500).json({ error: 'Could not verify usage limits' })
  }
}

// First day of next calendar month — shown to the user as "resets on".
const nextResetDate = (from) => {
  const d = new Date(from)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

module.exports = { checkUsageLimit, nextResetDate, isNewCalendarMonth }