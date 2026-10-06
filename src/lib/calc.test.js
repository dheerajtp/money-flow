import { describe, expect, it } from 'vitest'
import { buildAccountRow, emptyForm, formFromAccount, validateAccount } from './accountFields.js'
import { emergencyTarget, projectGoals } from './projection.js'
import { debtSummary, projectionSeries, retirementProjection } from './freedom.js'
import { buildFacts, categoryRiseFacts, savingsRateFact, subscriptionFact, topCategoriesFact } from './facts.js'

function loanForm(over = {}) {
  return { ...emptyForm('loan'), name: 'Car loan', emi_amount: '12000', emi_day: '5', first_emi_month: '2026-01', last_emi_month: '2027-12', ...over }
}

describe('account fields', () => {
  it('builds a loan row with month dates and numeric details', () => {
    const row = buildAccountRow(loanForm())
    expect(row).toMatchObject({ type: 'loan', name: 'Car loan', opening_balance: 0, linked_account_id: null })
    expect(row.details).toEqual({ emi_amount: 12000, emi_day: 5, first_emi_month: '2026-01-01', last_emi_month: '2027-12-01' })
  })
  it('rejects a loan with a bad day, amount or reversed months', () => {
    expect(validateAccount(loanForm({ emi_day: '32' })).emi_day).toBeTruthy()
    expect(validateAccount(loanForm({ emi_amount: '0' })).emi_amount).toBeTruthy()
    expect(validateAccount(loanForm({ last_emi_month: '2025-12' })).last_emi_month).toBeTruthy()
    expect(validateAccount(loanForm())).toEqual({})
  })
  it('stores a credit card amount owed as a negative opening balance and round-trips', () => {
    const form = { ...emptyForm('credit_card'), name: 'Card', opening: '2500', last4: '7777', credit_limit: '100000', statement_day: '1', due_day: '20' }
    expect(validateAccount(form)).toEqual({})
    const row = buildAccountRow(form)
    expect(row.opening_balance).toBe(-2500)
    expect(formFromAccount({ ...row, id: 'x', details: row.details }).opening).toBe('2500')
  })
  it('requires 4 digits for last4 and a bank for a debit card', () => {
    expect(validateAccount({ ...emptyForm('bank'), name: 'B', last4: '12' }).last4).toBeTruthy()
    expect(validateAccount({ ...emptyForm('debit_card'), name: 'D' }).linked_account_id).toBeTruthy()
    expect(buildAccountRow({ ...emptyForm('debit_card'), name: 'D', linked_account_id: 'abc', last4: '1111' }).linked_account_id).toBe('abc')
  })
  it('keeps opening 0 for SIP, stock, loan and insurance and needs an insurance date', () => {
    expect(buildAccountRow({ ...emptyForm('stock'), name: 'Stocks', opening: '99' }).opening_balance).toBe(0)
    expect(validateAccount({ ...emptyForm('insurance'), name: 'Life', premium_amount: '1200' }).next_due_date).toBeTruthy()
    expect(validateAccount({ ...emptyForm('sip'), name: 'S', monthly_amount: '500', sip_day: '10' })).toEqual({})
  })
})

describe('goals projection', () => {
  const today = '2026-10-06'
  it('suggests 6 months of spending unless overridden', () => {
    expect(emergencyTarget(null, 30000)).toEqual({ amount: 180000, suggested: true })
    expect(emergencyTarget(250000, 30000)).toEqual({ amount: 250000, suggested: false })
    expect(emergencyTarget(null, 0).amount).toBeNull()
  })
  it('funds the emergency fund first, then items in order', () => {
    const r = projectGoals({
      monthlySavings: 10000, emergencyShortfall: 25000, emergencyFirst: true, today,
      items: [{ id: 'a', price: 30000, savedSoFar: 0 }, { id: 'b', price: 15000, savedSoFar: 5000 }],
    })
    expect(r.emergencyMonths).toBe(3)
    expect(r.items[0]).toMatchObject({ id: 'a', monthsFromNow: 6, completion: '2027-04-06', remaining: 30000 })
    expect(r.items[1]).toMatchObject({ id: 'b', monthsFromNow: 7, completion: '2027-05-06', remaining: 10000 })
  })
  it('skips the emergency fund when switched off', () => {
    const r = projectGoals({ monthlySavings: 10000, emergencyShortfall: 25000, emergencyFirst: false, today, items: [{ id: 'a', price: 30000, savedSoFar: 0 }] })
    expect(r.items[0].monthsFromNow).toBe(3)
  })
  it('shows the monthly amount needed and whether the target date is met', () => {
    const items = [{ id: 'a', price: 30000, savedSoFar: 0, targetDate: '2027-01-06' }]
    const behind = projectGoals({ monthlySavings: 5000, emergencyFirst: false, today, items })
    expect(behind.items[0]).toMatchObject({ neededPerMonth: 10000, onTrack: false })
    const ahead = projectGoals({ monthlySavings: 20000, emergencyFirst: false, today, items })
    expect(ahead.items[0].onTrack).toBe(true)
  })
  it('handles an item already fully saved and no savings', () => {
    const done = projectGoals({ monthlySavings: 1000, emergencyFirst: false, today, items: [{ id: 'a', price: 500, savedSoFar: 500 }] })
    expect(done.items[0].monthsFromNow).toBe(0)
    expect(projectGoals({ monthlySavings: 0, today, items: [{ id: 'a', price: 500, savedSoFar: 0 }] }).noSavings).toBe(true)
    expect(projectGoals({ monthlySavings: -50, today, items: [] }).noSavings).toBe(true)
  })
})

describe('debt summary', () => {
  const loan = (id, last) => ({ id, name: id, details: { emi_amount: 1000, emi_day: 5, first_emi_month: '2026-01-01', last_emi_month: last } })
  it('has no debt', () => {
    expect(debtSummary({ loans: [], cards: [], today: '2026-10-06' })).toMatchObject({ debtFree: true, totalDebt: 0, debtFreeDate: null })
  })
  it('gives a debt-free date when only loans remain', () => {
    const s = debtSummary({ loans: [loan('a', '2026-12-01'), loan('b', '2027-06-01')], cards: [], today: '2026-10-06' })
    expect(s.loans.map((l) => l.monthsLeft)).toEqual([2, 8])
    expect(s.loansOwed).toBe(10000)
    expect(s.debtFreeDate).toBe('2027-06-05')
  })
  it('gives no date while a card balance is owed, and ignores finished loans', () => {
    const s = debtSummary({ loans: [loan('a', '2026-03-01')], cards: [{ name: 'Card', owed: 2700 }], today: '2026-10-06' })
    expect(s.loans).toHaveLength(0)
    expect(s).toMatchObject({ debtFreeDate: null, loansClearBy: null, cardsOwed: 2700, totalDebt: 2700, debtFree: false })
  })
})

describe('retirement projection', () => {
  const base = {
    dob: '1976-01-15', retirementAge: 51, today: '2026-01-15', livingMonthly: 1000, loans: [],
    investedNow: 1000, monthlyInvesting: 0,
    settings: { multiplier: 25, annualReturn: 0.12, inflation: 0 },
  }
  it('grows savings with the return, hand-checked: 1000 at 12% for a year is 1120', () => {
    const r = retirementProjection(base)
    expect(r.months).toBe(12)
    expect(r.projected).toBeCloseTo(1120, 6)
    expect(r.target).toBe(25 * 12 * 1000)
    expect(r.onTrack).toBe(false)
    expect(r.gap).toBeCloseTo(300000 - 1120, 6)
  })
  it('adds monthly investing with a zero return by simple addition', () => {
    const r = retirementProjection({ ...base, investedNow: 1000, monthlyInvesting: 100, settings: { ...base.settings, annualReturn: 0 } })
    expect(r.projected).toBe(2200)
  })
  it('adds monthly investing with a return (annuity), ~2384.66', () => {
    const r = retirementProjection({ ...base, monthlyInvesting: 100 })
    expect(r.projected).toBeCloseTo(2384.66, 1)
  })
  it('reports the extra monthly amount that closes the gap', () => {
    const r = retirementProjection(base)
    const rm = Math.pow(1.12, 1 / 12) - 1
    const factor = (Math.pow(1 + rm, 12) - 1) / rm
    expect(1000 * 1.12 + r.extraMonthly * factor).toBeCloseTo(r.target, 4)
  })
  it('inflates living costs but only counts EMIs that run past retirement', () => {
    const noEmi = retirementProjection({ ...base, settings: { ...base.settings, inflation: 0.06 } })
    expect(noEmi.target).toBeCloseTo(25 * 12000 * 1.06, 4)
    const loans = [{ emi: 500, lastEmi: '2026-12-05' }, { emi: 700, lastEmi: '2027-03-05' }]
    const withEmi = retirementProjection({ ...base, loans })
    expect(withEmi.target).toBe(25 * (12000 + 12 * 700))
  })
  it('finds the earliest freedom age, or null when it is never reached', () => {
    const rich = retirementProjection({ ...base, investedNow: 10_000_000 })
    expect(rich.onTrack).toBe(true)
    expect(rich.extraMonthly).toBe(0)
    expect(rich.freedomAge).toMatchObject({ years: 50, months: 0 })
    const never = retirementProjection({ ...base, investedNow: 0, monthlyInvesting: 0 })
    expect(never.freedomAge).toBeNull()
  })
  it('handles a retirement date that has passed', () => {
    const r = retirementProjection({ ...base, today: '2028-01-01' })
    expect(r).toMatchObject({ months: 0, alreadyReached: true })
    expect(r.extraMonthly).toBeNull()
  })
  it('produces chart points ending at retirement', () => {
    const s = projectionSeries(base)
    expect(s[0].date).toBe('2026-01-15')
    expect(s[s.length - 1].date).toBe('2027-01-15')
    expect(s[0].projected).toBe(1000)
  })
})

describe('facts', () => {
  it('states subscriptions, top categories, rises and saving rate as plain facts', () => {
    expect(subscriptionFact([{ subscriptions: 300 }, { subscriptions: 500 }])).toBe('Subscriptions cost ₹400.00 a month.')
    expect(subscriptionFact([{ subscriptions: 0 }])).toBeNull()
    expect(topCategoriesFact([{ name: 'Rent', total: 9 }, { name: 'Food', total: 5 }, { name: 'Fuel', total: 3 }, { name: 'Other', total: 1 }]))
      .toBe('Your top 3 categories are Rent, Food and Fuel.')
    expect(topCategoriesFact([{ name: 'Rent', total: 9 }])).toBe('Your top category is Rent.')
    expect(topCategoriesFact([])).toBeNull()
    expect(savingsRateFact([{ income: 1000, expenses: 600, emi: 100 }])).toBe('You saved 30% of your income.')
    expect(savingsRateFact([{ income: 1000, expenses: 1200, emi: 0 }])).toBe('You spent 20% more than your income.')
    expect(savingsRateFact([{ income: 0, expenses: 10 }])).toBeNull()
  })
  it('only reports rises of at least ₹500 and 20%', () => {
    const now = [{ name: 'Food', total: 3000 }, { name: 'Fuel', total: 2000 }, { name: 'Rent', total: 10100 }, { name: 'New', total: 900 }]
    const was = [{ name: 'Food', total: 2000 }, { name: 'Fuel', total: 1900 }, { name: 'Rent', total: 10000 }]
    expect(categoryRiseFacts(now, was)).toEqual(['Food is up ₹1,000.00 on last month.'])
  })
  it('combines the facts and drops the empty ones', () => {
    const facts = buildFacts({
      rangeRows: [{ income: 1000, expenses: 500, emi: 0 }], lastThreeRows: [{ subscriptions: 0 }],
      spending: [{ name: 'Rent', total: 500 }], thisMonthSpending: [], lastMonthSpending: [],
    })
    expect(facts).toEqual(['Your top category is Rent.', 'You saved 50% of your income.'])
  })
})
