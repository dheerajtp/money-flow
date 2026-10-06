import { addMonths, monthEnd, monthStart, monthsBetween } from './dates.js'

const num = (v) => Number(v) || 0

// Which months to average: up to `max` full months ending last month, but never
// before the month of the user's first entry. With no full month yet, the
// current month so far is used and flagged `partial`.
export function averagingRange(firstEntryISO, todayStr, max = 3) {
  if (!firstEntryISO) return null
  const thisStart = monthStart(todayStr)
  const firstStart = monthStart(firstEntryISO)
  const available = monthsBetween(firstStart, thisStart)
  if (available <= 0) return { from: thisStart, to: todayStr, months: 1, partial: true }
  const months = Math.min(max, available)
  const from = addMonths(thisStart, -months)
  return { from, to: monthEnd(addMonths(thisStart, -1)), months, partial: false }
}

// rows: monthly_summary() rows. Expenses here include loan EMI payments, so
// savings = income - expenses everywhere in the app.
export function monthlyAverages(rows) {
  const n = rows.length
  if (n === 0) return { months: 0, income: 0, living: 0, emi: 0, spending: 0, sip: 0, savings: 0, subscriptions: 0 }
  const sum = (key) => rows.reduce((s, r) => s + num(r[key]), 0) / n
  const income = sum('income')
  const living = sum('expenses')
  const emi = sum('emi')
  return {
    months: n,
    income,
    living,
    emi,
    spending: living + emi,
    sip: sum('sip'),
    savings: income - living - emi,
    subscriptions: sum('subscriptions'),
  }
}
