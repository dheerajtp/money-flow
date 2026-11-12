import { computePayPeriod, latestSalaryDate } from './payPeriod.js'

const num = (v) => Number(v) || 0

// Whole rupees, rounded down, so the screen never overstates what is safe to spend (8309.22 -> 8309).
export const rupeesDown = (n) => Math.floor(num(n) + 1e-9)

// Recurring occurrences still to be paid from the spending account, due today (no estimate yet) or later, and on or before `end`.
// An item due today normally already has its estimate, because the app syncs recurring items before any page renders;
// if it does not, it is counted here so the safe amount is never overstated.
// An occurrence that already has an entry (estimated or real) with the same recurring item and due date
// is skipped: its money has already left the balance. Rows marked as not active are skipped too.
export function committedBefore({ upcoming, entries, spendingAccountId, today, end }) {
  const posted = new Set(entries.filter((e) => e.recurring_item_id).map((e) => `${e.recurring_item_id}|${e.due_date}`))
  const items = upcoming.filter(
    (u) =>
      u.paying_account_id === spendingAccountId &&
      (u.status === undefined || u.status === 'active') &&
      u.due_date >= today &&
      u.due_date <= end &&
      !posted.has(`${u.item_id}|${u.due_date}`),
  )
  return { items, total: items.reduce((s, u) => s + num(u.amount), 0) }
}

// safe = balance - committed - card bill - floor, never below zero.
// Values keep their paise; use rupeesDown() for display.
export function computeSafeToSpend({ balance, floor, committed, cardDue = 0, daysLeft }) {
  const free = num(balance) - num(committed) - num(cardDue) - num(floor)
  const safe = Math.max(free, 0)
  const perDay = daysLeft > 0 ? safe / daysLeft : safe
  return { safe, perDay, perWeek: perDay * 7, usingFloor: free <= 0 }
}

// Everything the Planner header needs, from plain data. Null until a spending account is chosen.
// `cardDue` is the projected card bill due before payday (supplied by the card guard, 0 until it exists).
export function buildPlanner({ today, settings, accounts, upcoming, entries, cardDue = 0 }) {
  const spending = settings && accounts.find((a) => a.id === settings.spending_account_id)
  if (!spending) return null
  const salaryDate = latestSalaryDate({ entries, spendingAccountId: spending.id, salaryCategoryId: settings.salary_category_id, today })
  const period = computePayPeriod({ today, salaryDay: Number(settings.salary_day) || 1, salaryDate })
  const { total: committed, items } = committedBefore({ upcoming, entries, spendingAccountId: spending.id, today, end: period.end })
  const balance = num(spending.position)
  const floor = num(settings.floor_amount)
  const result = computeSafeToSpend({ balance, floor, committed, cardDue, daysLeft: period.daysLeft })
  return {
    today,
    period,
    daysLeft: period.daysLeft,
    balance,
    floor,
    committed,
    committedItems: items,
    cardDue: num(cardDue),
    ...result,
    display: { safe: rupeesDown(result.safe), perDay: rupeesDown(result.perDay), perWeek: rupeesDown(result.perWeek) },
  }
}
