import { addDays, addMonths, daysBetween, monthEnd, monthStart } from './dates.js'

export const PERIODS = [
  { key: 'this', label: 'This month' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 3 months' },
]

// The chosen period and the period just before it (for "vs. last period").
export function periodRanges(key, today) {
  if (key === 'last30' || key === 'last90') {
    const days = key === 'last30' ? 30 : 90
    const from = addDays(today, -(days - 1))
    return { cur: { from, to: today }, prev: { from: addDays(from, -days), to: addDays(from, -1) } }
  }
  const from = monthStart(today)
  const prevFrom = addMonths(from, -1)
  const elapsed = daysBetween(from, today)
  const prevTo = addDays(prevFrom, elapsed)
  return { cur: { from, to: today }, prev: { from: prevFrom, to: prevTo > monthEnd(prevFrom) ? monthEnd(prevFrom) : prevTo } }
}

const n = (v) => Number(v) || 0

// Adds up monthly_summary rows. Spending includes loan EMIs, so saved = income - spent everywhere.
export function sumPeriod(rows) {
  const income = rows.reduce((s, r) => s + n(r.income), 0)
  const spent = rows.reduce((s, r) => s + n(r.expenses) + n(r.emi), 0)
  return { income, spent, saved: income - spent, rate: income > 0 ? Math.round(((income - spent) / income) * 100) : null }
}

// Percentage change from previous to current; null when there is nothing to compare with.
export function deltaPercent(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}
