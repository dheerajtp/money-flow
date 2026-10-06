import { formatINR } from './money.js'

export const RISE_MIN_AMOUNT = 500
export const RISE_MIN_PERCENT = 20

const num = (v) => Number(v) || 0

// Plain statements about the data, never advice.
export function subscriptionFact(lastThreeMonthsRows) {
  if (!lastThreeMonthsRows.length) return null
  const avg = lastThreeMonthsRows.reduce((s, r) => s + num(r.subscriptions), 0) / lastThreeMonthsRows.length
  return avg > 0 ? `Subscriptions cost ${formatINR(avg)} a month.` : null
}

export function topCategoriesFact(spending) {
  const top = spending.filter((c) => num(c.total) > 0).slice(0, 3)
  if (top.length === 0) return null
  const names = top.map((c) => c.name)
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `Your top ${top.length === 1 ? 'category is' : `${top.length} categories are`} ${list}.`
}

export function categoryRiseFacts(current, previous) {
  const before = new Map(previous.map((c) => [c.name, num(c.total)]))
  return current
    .map((c) => ({ name: c.name, now: num(c.total), was: before.get(c.name) || 0 }))
    .map((c) => ({ ...c, rise: c.now - c.was }))
    .filter((c) => c.rise >= RISE_MIN_AMOUNT && c.was > 0 && (c.rise / c.was) * 100 >= RISE_MIN_PERCENT)
    .sort((a, b) => b.rise - a.rise)
    .slice(0, 3)
    .map((c) => `${c.name} is up ${formatINR(c.rise)} on last month.`)
}

export function savingsRateFact(rows) {
  const income = rows.reduce((s, r) => s + num(r.income), 0)
  const spent = rows.reduce((s, r) => s + num(r.expenses) + num(r.emi), 0)
  if (income <= 0) return null
  const pct = Math.round(((income - spent) / income) * 100)
  return pct >= 0 ? `You saved ${pct}% of your income.` : `You spent ${Math.abs(pct)}% more than your income.`
}

export function buildFacts({ rangeRows, lastThreeRows, spending, thisMonthSpending, lastMonthSpending }) {
  return [
    subscriptionFact(lastThreeRows),
    topCategoriesFact(spending),
    ...categoryRiseFacts(thisMonthSpending, lastMonthSpending),
    savingsRateFact(rangeRows),
  ].filter(Boolean)
}
