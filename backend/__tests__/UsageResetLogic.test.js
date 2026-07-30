const { isNewCalendarMonth, nextResetDate } = require('../middleware/checkUsageLimit')

describe('checkUsageLimit date logic', () => {

  describe('isNewCalendarMonth', () => {
    it('returns false for a reset date earlier this same month', () => {
      const now = new Date()
      const earlierThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      expect(isNewCalendarMonth(earlierThisMonth)).toBe(false)
    })

    it('returns true for a reset date from last month', () => {
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      expect(isNewCalendarMonth(lastMonth)).toBe(true)
    })

    it('returns true for a reset date from last year (December → January rollover)', () => {
      const now = new Date()
      const lastYear = new Date(now.getFullYear() - 1, 11, 20) // Dec 20 last year
      expect(isNewCalendarMonth(lastYear)).toBe(true)
    })

    it('returns false for "right now"', () => {
      expect(isNewCalendarMonth(new Date())).toBe(false)
    })
  })

  describe('nextResetDate', () => {
    it('returns the 1st of the following month', () => {
      const from = new Date(2026, 2, 15) // March 15, 2026
      const result = nextResetDate(from)
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(3) // April (0-indexed)
      expect(result.getDate()).toBe(1)
    })

    it('correctly rolls over December to January of the next year', () => {
      const from = new Date(2026, 11, 25) // Dec 25, 2026
      const result = nextResetDate(from)
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(1)
    })
  })

})