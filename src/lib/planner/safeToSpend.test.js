import { describe, expect, it } from 'vitest'
import { buildPlanner, committedBefore, computeSafeToSpend, rupeesDown } from './safeToSpend.js'
import { SPENDING, account, buildFixture, entry, upcomingItem } from './fixture.js'


describe('Row 1: safe to spend', () => {
  it('subtracts bills still due and the floor from the balance', () => {
    const r = buildPlanner(buildFixture())
    expect(r.today).toBe('2026-11-12')
    expect(r.committed).toBeCloseTo(971.9, 2)
    expect(r.cardDue).toBe(0)
    expect(r.safe).toBeCloseTo(8309.22, 2)
    expect(r.display.safe).toBe(8309)
    expect(r.daysLeft).toBe(23)
    expect(r.perDay).toBeCloseTo(361.27, 2)
    expect(r.display).toEqual({ safe: 8309, perDay: 361, perWeek: 2528 })
    expect(r.usingFloor).toBe(false)
    expect(r.period).toMatchObject({ start: '2026-11-05', end: '2026-12-05' })
  })
  it('counts an item due on the salary day itself (cutoff is on or before)', () => {
    const f = buildFixture({ upcoming: [upcomingItem({ item_id: 'x', due_date: '2026-12-05', amount: 1000 })] })
    expect(buildPlanner(f).committed).toBe(1000)
  })
  it('does not count an item after the salary date', () => {
    const f = buildFixture({ upcoming: [upcomingItem({ item_id: 'b', due_date: '2026-12-06', amount: 222 })] })
    expect(buildPlanner(f).committed).toBe(0)
  })
})

describe('an item due today', () => {
  it('with no estimate yet (sync not run) is counted, so safe to spend is not overstated', () => {
    const f = buildFixture({ upcoming: [upcomingItem({ item_id: 'today', due_date: '2026-11-12', amount: 300 })] })
    const r = buildPlanner(f)
    expect(r.committed).toBe(300)
    expect(r.safe).toBeCloseTo(14281.12 - 300 - 5000, 2)
  })
  it('once its estimate exists, the balance is lower and it is not counted again', () => {
    const f = buildFixture({
      accounts: [account({ position: 14281.12 - 300 })],
      upcoming: [upcomingItem({ item_id: 'today', due_date: '2026-11-12', amount: 300 })],
      entries: [...buildFixture().entries, entry({ id: 'est-today', status: 'estimated', source: 'recurring', amount: 300, entry_date: '2026-11-12', recurring_item_id: 'today', due_date: '2026-11-12' })],
    })
    const r = buildPlanner(f)
    expect(r.committed).toBe(0)
    expect(r.safe).toBeCloseTo(14281.12 - 300 - 5000, 2)
  })
})

describe('rupeesDown', () => {
  it('rounds down to whole rupees and never up', () => {
    expect(rupeesDown(8309.22)).toBe(8309)
    expect(rupeesDown(8309.99)).toBe(8309)
    expect(rupeesDown(361.27)).toBe(361)
    expect(rupeesDown(0)).toBe(0)
    expect(rupeesDown(null)).toBe(0)
  })
})

describe('Row 3: posting an estimate changes nothing', () => {
  it('balance and committed both fall by the same amount, so safe to spend is unchanged', () => {
    const before = buildPlanner(buildFixture())
    const after = buildPlanner(buildFixture({
      today: '2026-11-19',
      accounts: [account({ position: 14281.12 - 499 })],
      upcoming: [upcomingItem({ item_id: 'r2', due_date: '2026-12-05', amount: 472.9 })],
      entries: [buildFixture().entries[0], entry({ id: 'est', status: 'estimated', source: 'recurring', kind: 'expense', amount: 499, entry_date: '2026-11-19', recurring_item_id: 'r1', due_date: '2026-11-19' })],
    }))
    expect(after.committed).toBeCloseTo(before.committed - 499, 2)
    expect(after.safe).toBeCloseTo(before.safe, 2)
  })
  it('an occurrence that already has an entry (estimated or real) is not counted again', () => {
    for (const status of ['estimated', 'confirmed']) {
      const f = buildFixture({
        accounts: [account({ position: 14281.12 - 499 })],
        entries: [...buildFixture().entries, entry({ id: 'paid', status, kind: 'expense', amount: 499, entry_date: '2026-11-10', recurring_item_id: 'r1', due_date: '2026-11-19' })],
      })
      const r = buildPlanner(f)
      expect(r.committed).toBeCloseTo(472.9, 2)
      expect(r.safe).toBeCloseTo(8309.22, 2)
    }
  })
  it('an entry for a different due date of the same item does not hide the occurrence', () => {
    const f = buildFixture({ entries: [...buildFixture().entries, entry({ id: 'old', recurring_item_id: 'r1', due_date: '2026-10-19' })] })
    expect(buildPlanner(f).committed).toBeCloseTo(971.9, 2)
  })
})

describe('Row 6: salary late, never negative', () => {
  it('shows ₹0 and "using your floor" when bills exceed the free money', () => {
    const f = buildFixture({ today: '2026-12-06', accounts: [account({ position: 5200 })], upcoming: [upcomingItem({ due_date: '2026-12-07', amount: 900 })] })
    const r = buildPlanner(f)
    expect(r.period.salaryLate).toBe(true)
    expect(r.daysLeft).toBe(1)
    expect(r.safe).toBe(0)
    expect(r.perDay).toBe(0)
    expect(r.usingFloor).toBe(true)
  })
  it('recomputes per day over the extended period', () => {
    const f = buildFixture({ today: '2026-12-06', accounts: [account({ position: 9000 })], upcoming: [] })
    const r = buildPlanner(f)
    expect(r.safe).toBe(4000)
    expect(r.perDay).toBe(4000)
  })
})

describe('Row 7: paused or ended recurring items', () => {
  it('are not in committed, whatever their kind', () => {
    const f = buildFixture({
      upcoming: [
        upcomingItem({ item_id: 'sip1', kind: 'subscription', status: 'paused', due_date: '2026-11-20', amount: 5000 }),
        upcomingItem({ item_id: 'sip2', kind: 'emi', status: 'ended', due_date: '2026-11-21', amount: 7000 }),
        upcomingItem({ item_id: 'live', due_date: '2026-11-22', amount: 300 }),
      ],
    })
    expect(buildPlanner(f).committed).toBe(300)
  })
  it('works when the user has no recurring items at all', () => {
    const r = buildPlanner(buildFixture({ upcoming: [] }))
    expect(r.committed).toBe(0)
    expect(r.safe).toBeCloseTo(9281.12, 2)
  })
})

describe('what counts', () => {
  it('only counts items paid from the spending account', () => {
    const f = buildFixture({ upcoming: [upcomingItem({ paying_account_id: 'other', amount: 800 }), upcomingItem({ item_id: 'z', amount: 200 })] })
    expect(buildPlanner(f).committed).toBe(200)
  })
  it('subtracts a card bill when its due date falls before the next salary', () => {
    const r = buildPlanner(buildFixture({ cardDue: 2000 }))
    expect(r.cardDue).toBe(2000)
    expect(r.safe).toBeCloseTo(6309.22, 2)
  })
  it('works with a different spending account and no salary entry', () => {
    const f = buildFixture({
      settings: { spending_account_id: 'acc-2', salary_category_id: null, salary_day: 1, floor_amount: 0, expected_salary_amount: null },
      accounts: [account({ id: 'acc-2', position: 3000 })],
      entries: [],
      upcoming: [],
      today: '2026-11-12',
    })
    const r = buildPlanner(f)
    expect(r.period.usedFallbackStart).toBe(true)
    expect(r.period.end).toBe('2026-12-01')
    expect(r.safe).toBe(3000)
    expect(r.daysLeft).toBe(19)
  })
  it('returns null until the user has chosen a spending account', () => {
    expect(buildPlanner(buildFixture({ settings: null }))).toBeNull()
    expect(buildPlanner(buildFixture({ accounts: [] }))).toBeNull()
  })
})

describe('computeSafeToSpend', () => {
  it('derives per day and per week from the safe amount', () => {
    const r = computeSafeToSpend({ balance: 1000, floor: 100, committed: 0, cardDue: 0, daysLeft: 9 })
    expect(r).toMatchObject({ safe: 900, perDay: 100, perWeek: 700, usingFloor: false })
  })
  it('never goes below zero', () => {
    const r = computeSafeToSpend({ balance: 100, floor: 500, committed: 50, cardDue: 0, daysLeft: 3 })
    expect(r).toMatchObject({ safe: 0, perDay: 0, perWeek: 0, usingFloor: true })
  })
})

describe('committedBefore', () => {
  it('lists the occurrences that were counted', () => {
    const { total, items } = committedBefore({ upcoming: buildFixture().upcoming, entries: [], spendingAccountId: SPENDING, today: '2026-11-12', end: '2026-12-05' })
    expect(items).toHaveLength(2)
    expect(total).toBeCloseTo(971.9, 2)
  })
})
