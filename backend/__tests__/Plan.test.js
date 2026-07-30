const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = require('../config/db')
const Plan = require('../models/Plan')
const planService = require('../services/planService')

const TEST_PLAN_ID = 'jest_test_plan'

beforeAll(async () => {
  await connectDB()
})

afterAll(async () => {
  // Clean up test plan — never touches your real free/pro plans.
  await Plan.deleteMany({ planId: TEST_PLAN_ID })
  await mongoose.connection.close()
})

describe('planService', () => {

  describe('getActivePlans', () => {
    it('returns the seeded free and pro plans', async () => {
      const plans = await planService.getActivePlans()
      const planIds = plans.map(p => p.planId)

      expect(planIds).toContain('free')
      expect(planIds).toContain('pro')
    })

    it('never includes a deactivated plan', async () => {
      await Plan.create({
        planId: TEST_PLAN_ID,
        name: 'Jest Test Plan',
        priceInPaise: 100,
        currency: 'INR',
        billingCycle: 'lifetime',
        isActive: false,
      })

      const plans = await planService.getActivePlans()
      const planIds = plans.map(p => p.planId)

      expect(planIds).not.toContain(TEST_PLAN_ID)
    })
  })

  describe('getPlanById', () => {
    it('finds the pro plan by planId, case-insensitively', async () => {
      const plan = await planService.getPlanById('PRO')
      expect(plan).not.toBeNull()
      expect(plan.planId).toBe('pro')
    })

    it('returns null for a plan that does not exist', async () => {
      const plan = await planService.getPlanById('nonexistent_plan_xyz')
      expect(plan).toBeNull()
    })

    it('returns null for an empty/missing planId rather than throwing', async () => {
      await expect(planService.getPlanById(undefined)).resolves.toBeNull()
      await expect(planService.getPlanById('')).resolves.toBeNull()
    })
  })

})