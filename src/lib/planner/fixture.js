// Test fixture for the Planner. Plain data in the shapes the database returns
// (account_positions merged onto accounts, upcoming_recurring rows, entries rows).
// The defaults are a sample user; every test overrides what it needs and asserts on
// computed numbers, never on names. Nothing here is used by the app itself.

export const SPENDING = 'acc-spending'
export const SALARY_CAT = 'cat-salary'

export const account = (over = {}) => ({ id: SPENDING, type: 'bank', name: 'Sample bank', position: 14281.12, details: {}, ...over })

export const entry = (over = {}) => ({
  id: 'e1',
  kind: 'expense',
  status: 'confirmed',
  source: 'manual',
  account_id: SPENDING,
  to_account_id: null,
  category_id: null,
  entry_date: '2026-11-01',
  amount: 100,
  recurring_item_id: null,
  due_date: null,
  ...over,
})

export const salaryEntry = (over = {}) => entry({ id: 'salary', kind: 'income', category_id: SALARY_CAT, entry_date: '2026-11-05', amount: 142000, ...over })

export const upcomingItem = (over = {}) => ({
  item_id: 'r1',
  name: 'Sample item',
  kind: 'subscription',
  due_date: '2026-11-19',
  amount: 499,
  paying_account_id: SPENDING,
  ...over,
})

// Row 1 scenario: today 12 Nov 2026, salary day 5, floor 5000, two bills before the next salary.
export function buildFixture(over = {}) {
  return {
    today: '2026-11-12',
    settings: { spending_account_id: SPENDING, salary_category_id: SALARY_CAT, salary_day: 5, floor_amount: 5000, expected_salary_amount: 50000 },
    accounts: [account()],
    entries: [salaryEntry()],
    upcoming: [
      upcomingItem({ item_id: 'r1', due_date: '2026-11-19', amount: 499 }),
      upcomingItem({ item_id: 'r2', due_date: '2026-12-05', amount: 472.9 }),
    ],
    ...over,
  }
}
