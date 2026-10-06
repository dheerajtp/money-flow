import { addMonths, daysBetween, monthsBetween } from './dates.js'

// Emergency fund: the user's own target, otherwise 6 x average monthly spending.
export function emergencyTarget(override, avgSpending) {
  if (override && Number(override) > 0) return { amount: Number(override), suggested: false }
  if (avgSpending > 0) return { amount: Math.round(avgSpending * 6 * 100) / 100, suggested: true }
  return { amount: null, suggested: false }
}

// Bucket-list items are funded one after another from monthly savings.
// items: [{ id, price, savedSoFar, targetDate }] already in priority order.
export function projectGoals({ monthlySavings, emergencyShortfall = 0, emergencyFirst = true, items, today }) {
  if (!(monthlySavings > 0)) return { noSavings: true, emergencyMonths: null, items: items.map((i) => ({ id: i.id, remaining: Math.max(i.price - i.savedSoFar, 0) })) }
  let offset = 0
  let emergencyMonths = 0
  if (emergencyFirst && emergencyShortfall > 0) {
    emergencyMonths = Math.ceil(emergencyShortfall / monthlySavings)
    offset = emergencyMonths
  }
  const out = items.map((item) => {
    const remaining = Math.max(item.price - item.savedSoFar, 0)
    const months = remaining === 0 ? 0 : Math.ceil(remaining / monthlySavings)
    offset += months
    const completion = addMonths(today, offset)
    const result = { id: item.id, remaining, monthsFromNow: offset, completion }
    if (item.targetDate) {
      const monthsUntil = Math.max(monthsBetween(today, item.targetDate), 1)
      result.neededPerMonth = remaining / monthsUntil
      result.onTrack = remaining === 0 || daysBetween(completion, item.targetDate) >= 0
    }
    return result
  })
  return { noSavings: false, emergencyMonths, items: out }
}
