const Plan = require('../models/Plan')

// All plans visible on the pricing page, cheapest-first by sortOrder.
const getActivePlans = async () => {
  return Plan.find({ isActive: true }).sort({ sortOrder: 1 }).select('-__v')
}

// A single plan by its stable slug ('free', 'pro'). Returns null if the
// plan doesn't exist or has been deactivated — callers must handle that,
// never assume a plan is purchasable just because a planId string was sent.
const getPlanById = async (planId) => {
  if (!planId) return null
  return Plan.findOne({ planId: planId.toLowerCase().trim(), isActive: true })
}

module.exports = { getActivePlans, getPlanById }