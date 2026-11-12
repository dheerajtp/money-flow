import { addDays, addMonths, clampDate, daysBetween, monthStart, parseISO } from '../dates.js'

// The user's local calendar date. Pass a zone to be explicit; by default the browser's zone is used.
// Never derive the date from toISOString(): that is UTC and is a day behind just after midnight in India.
export function todayInTimeZone(now = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = (type) => parts.find((p) => p.type === type).value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// Date of the latest salary entry on the spending account: income in the chosen salary
// category, not a draft, dated on or before today. Null when there is none.
export function latestSalaryDate({ entries, spendingAccountId, salaryCategoryId, today }) {
  if (!spendingAccountId || !salaryCategoryId) return null
  const dates = entries
    .filter((e) => e.kind === 'income' && e.status !== 'draft' && e.account_id === spendingAccountId && e.category_id === salaryCategoryId && e.entry_date <= today)
    .map((e) => e.entry_date)
    .sort()
  return dates.length ? dates[dates.length - 1] : null
}

// The salary day of the month `monthOffset` months after the month of `iso`, clamped to month length.
function salaryDayIn(iso, monthOffset, salaryDay) {
  const { y, m } = parseISO(addMonths(monthStart(iso), monthOffset))
  return clampDate(y, m, salaryDay)
}

// The current pay period.
// - start: the latest salary entry, or (no entry yet) the most recent salary day on or before today.
// - nominal end: the salary day in the month after the start.
// - if that day has passed with no new salary, the period is extended one day at a time (salaryLate).
// - daysLeft counts today but not the salary day, and is at least 1.
export function computePayPeriod({ today, salaryDay, salaryDate }) {
  let start = salaryDate
  const usedFallbackStart = !salaryDate
  if (!start) {
    const thisMonth = salaryDayIn(today, 0, salaryDay)
    start = thisMonth <= today ? thisMonth : salaryDayIn(today, -1, salaryDay)
  }
  const nominalEnd = salaryDayIn(start, 1, salaryDay)
  const salaryLate = today > nominalEnd
  const end = nominalEnd > today ? nominalEnd : addDays(today, 1)
  return { start, nominalEnd, end, daysLeft: daysBetween(today, end), salaryLate, usedFallbackStart }
}
