import { describe, expect, it } from 'vitest'
import { computePayPeriod, latestSalaryDate, todayInTimeZone } from './payPeriod.js'
import { SALARY_CAT, SPENDING, entry, salaryEntry } from './fixture.js'

describe('todayInTimeZone', () => {
  it('uses the local date, not the UTC date, at 00:05 IST', () => {
    const instant = new Date('2026-11-11T18:35:00Z') // 00:05 on 12 Nov in India, still 11 Nov in UTC
    expect(instant.toISOString().slice(0, 10)).toBe('2026-11-11')
    expect(todayInTimeZone(instant, 'Asia/Kolkata')).toBe('2026-11-12')
  })
  it('stays on the same day until midnight IST', () => {
    expect(todayInTimeZone(new Date('2026-11-12T18:25:00Z'), 'Asia/Kolkata')).toBe('2026-11-12')
    expect(todayInTimeZone(new Date('2026-11-12T18:30:00Z'), 'Asia/Kolkata')).toBe('2026-11-13')
  })
  it('follows another zone when given one', () => {
    expect(todayInTimeZone(new Date('2026-11-12T03:00:00Z'), 'America/Los_Angeles')).toBe('2026-11-11')
  })
})

describe('latestSalaryDate', () => {
  const args = { spendingAccountId: SPENDING, salaryCategoryId: SALARY_CAT, today: '2026-11-12' }
  it('takes the latest salary entry on the spending account', () => {
    const entries = [salaryEntry({ id: 'a', entry_date: '2026-10-05' }), salaryEntry({ id: 'b', entry_date: '2026-11-05' })]
    expect(latestSalaryDate({ ...args, entries })).toBe('2026-11-05')
  })
  it('ignores drafts, other accounts, other categories, non-income and future dates', () => {
    const entries = [
      salaryEntry({ id: 'draft', status: 'draft', entry_date: '2026-11-10' }),
      salaryEntry({ id: 'other-acc', account_id: 'x', entry_date: '2026-11-10' }),
      salaryEntry({ id: 'other-cat', category_id: 'y', entry_date: '2026-11-10' }),
      entry({ id: 'exp', kind: 'expense', category_id: SALARY_CAT, entry_date: '2026-11-10' }),
      salaryEntry({ id: 'future', entry_date: '2026-11-20' }),
      salaryEntry({ id: 'ok', entry_date: '2026-10-05' }),
    ]
    expect(latestSalaryDate({ ...args, entries })).toBe('2026-10-05')
  })
  it('counts an estimated salary entry', () => {
    expect(latestSalaryDate({ ...args, entries: [salaryEntry({ status: 'estimated' })] })).toBe('2026-11-05')
  })
  it('returns null when there is no salary entry', () => {
    expect(latestSalaryDate({ ...args, entries: [] })).toBeNull()
    expect(latestSalaryDate({ ...args, entries: [salaryEntry()], salaryCategoryId: null })).toBeNull()
  })
})

describe('computePayPeriod', () => {
  it('runs from the salary entry to the salary day of the next month (Row 1: 23 days left)', () => {
    const p = computePayPeriod({ today: '2026-11-12', salaryDay: 5, salaryDate: '2026-11-05' })
    expect(p).toMatchObject({ start: '2026-11-05', end: '2026-12-05', daysLeft: 23, salaryLate: false, usedFallbackStart: false })
  })
  it('starts on the salary day when there is no salary entry', () => {
    const p = computePayPeriod({ today: '2026-11-12', salaryDay: 5, salaryDate: null })
    expect(p).toMatchObject({ start: '2026-11-05', end: '2026-12-05', daysLeft: 23, usedFallbackStart: true })
  })
  it('fallback start uses the previous month when the salary day has not come yet', () => {
    const p = computePayPeriod({ today: '2026-11-03', salaryDay: 5, salaryDate: null })
    expect(p).toMatchObject({ start: '2026-10-05', end: '2026-11-05', daysLeft: 2 })
  })
  it('clamps a salary day that the month does not have', () => {
    expect(computePayPeriod({ today: '2027-01-10', salaryDay: 31, salaryDate: '2026-12-31' }).end).toBe('2027-01-31')
    expect(computePayPeriod({ today: '2027-02-10', salaryDay: 31, salaryDate: '2027-01-31' }).end).toBe('2027-02-28')
  })
  it('is not late on the salary day itself, and counts one day', () => {
    const p = computePayPeriod({ today: '2026-12-05', salaryDay: 5, salaryDate: '2026-11-05' })
    expect(p).toMatchObject({ salaryLate: false, daysLeft: 1 })
  })
  it('Row 6: no salary entry by 5 Dec shows Salary late and extends a day at a time', () => {
    const d6 = computePayPeriod({ today: '2026-12-06', salaryDay: 5, salaryDate: '2026-11-05' })
    expect(d6).toMatchObject({ salaryLate: true, end: '2026-12-07', daysLeft: 1, start: '2026-11-05' })
    const d9 = computePayPeriod({ today: '2026-12-09', salaryDay: 5, salaryDate: '2026-11-05' })
    expect(d9).toMatchObject({ salaryLate: true, end: '2026-12-10', daysLeft: 1 })
  })
  it('a salary that arrives starts a new period', () => {
    const p = computePayPeriod({ today: '2026-12-08', salaryDay: 5, salaryDate: '2026-12-07' })
    expect(p).toMatchObject({ start: '2026-12-07', end: '2027-01-05', salaryLate: false })
  })
})
