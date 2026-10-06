import { describe, expect, it } from 'vitest'
import { formatINR, parseAmount, round2 } from './money.js'
import { addDays, addMonths, daysBetween, formatDate, formatMonth, monthEnd, monthStart, monthsBetween, nthMonthDate, todayISO } from './dates.js'
import { emiDates, lastEmiDate, loanOwed, monthsLeft } from './loans.js'
import { ageInMonths, ageOn, monthsToRetirement, retirementDate } from './retirement.js'
import { normalizeMerchant } from './merchant.js'
import { averagingRange, monthlyAverages } from './monthlyAverages.js'
import { rangeFor } from './ranges.js'
import { errorMessage } from './db.js'

describe('money', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(formatINR(10048176 / 100)).toBe('₹1,00,481.76')
    expect(formatINR(0)).toBe('₹0.00')
    expect(formatINR('163')).toBe('₹163.00')
  })
  it('parses amounts typed by people', () => {
    expect(parseAmount('1,00,481.76')).toBe(100481.76)
    expect(parseAmount('₹ 500')).toBe(500)
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('')).toBeNull()
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})

describe('dates', () => {
  it('clamps month ends like the database', () => {
    expect(nthMonthDate('2026-01-31', 1, 31)).toBe('2026-02-28')
    expect(nthMonthDate('2026-01-31', 2, 31)).toBe('2026-03-31')
    expect(nthMonthDate('2027-12-15', 2, 15)).toBe('2028-02-15')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
  })
  it('does month and day arithmetic', () => {
    expect(monthStart('2026-10-17')).toBe('2026-10-01')
    expect(monthEnd('2026-02-10')).toBe('2026-02-28')
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(daysBetween('2026-10-01', '2026-10-06')).toBe(5)
    expect(monthsBetween('2026-01-31', '2026-03-01')).toBe(2)
  })
  it('uses the local calendar date', () => {
    expect(todayISO(new Date(2026, 9, 6, 23, 59))).toBe('2026-10-06')
  })
  it('formats for people', () => {
    expect(formatDate('2026-10-05')).toBe('05 Oct 2026')
    expect(formatMonth('2026-10-05')).toBe('Oct 2026')
  })
})

describe('loans (same results as the database tests)', () => {
  const d = { emi_amount: 1000, emi_day: 5, first_emi_month: '2026-01-01', last_emi_month: '2026-12-01' }
  it('counts EMIs left; the EMI date itself counts as paid', () => {
    expect(emiDates(d)).toHaveLength(12)
    expect(monthsLeft(d, '2026-06-10')).toBe(6)
    expect(monthsLeft(d, '2026-06-05')).toBe(6)
    expect(monthsLeft(d, '2026-06-04')).toBe(7)
    expect(monthsLeft(d, '2026-12-05')).toBe(0)
    expect(monthsLeft(d, '2025-12-31')).toBe(12)
    expect(loanOwed(d, '2026-06-10')).toBe(6000)
    expect(lastEmiDate(d)).toBe('2026-12-05')
  })
})

describe('retirement', () => {
  it('finds the retirement date and months left', () => {
    expect(retirementDate('1976-01-15', 51)).toBe('2027-01-15')
    expect(retirementDate('1976-02-29', 55)).toBe('2031-02-28')
    expect(monthsToRetirement('1976-01-15', 51, '2026-01-15')).toBe(12)
    expect(monthsToRetirement('1976-01-15', 51, '2026-01-20')).toBe(11)
    expect(monthsToRetirement('1976-01-15', 51, '2028-01-01')).toBe(0)
  })
  it('computes age', () => {
    expect(ageOn('1990-06-15', '2026-06-14')).toBe(35)
    expect(ageOn('1990-06-15', '2026-06-15')).toBe(36)
    expect(ageInMonths('1990-06-15', '2026-09-20')).toBe(36 * 12 + 3)
  })
})

describe('merchant keys', () => {
  it('normalizes names', () => {
    expect(normalizeMerchant('  APPLE  Media-Services! ')).toBe('apple media services')
    expect(normalizeMerchant('someone@okbank')).toBe('someone@okbank')
    expect(normalizeMerchant(null)).toBe('')
  })
})

describe('averaging', () => {
  it('uses up to 3 full months, never before the first entry', () => {
    expect(averagingRange('2026-07-20', '2026-10-06')).toEqual({ from: '2026-07-01', to: '2026-09-30', months: 3, partial: false })
    expect(averagingRange('2026-09-10', '2026-10-06')).toEqual({ from: '2026-09-01', to: '2026-09-30', months: 1, partial: false })
    expect(averagingRange('2025-01-01', '2026-10-06').from).toBe('2026-07-01')
  })
  it('falls back to the current month so far, or null with no entries', () => {
    expect(averagingRange('2026-10-02', '2026-10-06')).toEqual({ from: '2026-10-01', to: '2026-10-06', months: 1, partial: true })
    expect(averagingRange(null, '2026-10-06')).toBeNull()
  })
  it('averages income, spending (with EMIs) and savings', () => {
    const rows = [
      { income: 1000, expenses: 400, emi: 100, sip: 50, subscriptions: 10 },
      { income: 2000, expenses: 600, emi: 100, sip: 150, subscriptions: 30 },
    ]
    expect(monthlyAverages(rows)).toEqual({ months: 2, income: 1500, living: 500, emi: 100, spending: 600, sip: 100, savings: 900, subscriptions: 20 })
    expect(monthlyAverages([]).months).toBe(0)
  })
})

describe('ranges', () => {
  it('builds the preset ranges from full months', () => {
    expect(rangeFor('this', '2026-10-06')).toEqual({ from: '2026-10-01', to: '2026-10-06' })
    expect(rangeFor('last3', '2026-10-06')).toEqual({ from: '2026-07-01', to: '2026-09-30' })
    expect(rangeFor('last12', '2026-10-06')).toEqual({ from: '2025-10-01', to: '2026-09-30' })
  })
  it('validates custom ranges', () => {
    expect(rangeFor('custom', '2026-10-06', { from: '2026-01-01', to: '2026-03-31' })).toEqual({ from: '2026-01-01', to: '2026-03-31' })
    expect(rangeFor('custom', '2026-10-06', {}).error).toBeTruthy()
    expect(rangeFor('custom', '2026-10-06', { from: '2026-05-01', to: '2026-01-01' }).error).toBeTruthy()
    expect(rangeFor('custom', '2026-10-06', { from: '2020-01-01', to: '2026-01-01' }).error).toBeTruthy()
  })
})

describe('error messages', () => {
  it('is friendly for known codes and passes other messages through', () => {
    expect(errorMessage({ code: '23505' })).toBe('That already exists.')
    expect(errorMessage({ code: '23514', message: 'amount is less than the total of its items' })).toBe('amount is less than the total of its items')
    expect(errorMessage(null)).toBe('')
  })
})

import { deltaPercent, periodRanges, sumPeriod } from './periods.js'

describe('dashboard periods', () => {
  it('compares this month so far with the same number of days last month', () => {
    expect(periodRanges('this', '2026-10-06')).toEqual({
      cur: { from: '2026-10-01', to: '2026-10-06' },
      prev: { from: '2026-09-01', to: '2026-09-06' },
    })
    // a short previous month is capped at its last day
    expect(periodRanges('this', '2026-03-31').prev).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
  it('compares rolling periods with the period right before them', () => {
    expect(periodRanges('last30', '2026-10-30')).toEqual({
      cur: { from: '2026-10-01', to: '2026-10-30' },
      prev: { from: '2026-09-01', to: '2026-09-30' },
    })
    expect(periodRanges('last90', '2026-10-06').cur.from).toBe('2026-07-09')
  })
  it('sums rows with EMIs counted as spending, and works out the saving rate', () => {
    expect(sumPeriod([{ income: 1000, expenses: 400, emi: 100 }, { income: 1000, expenses: 300, emi: 100 }])).toEqual({ income: 2000, spent: 900, saved: 1100, rate: 55 })
    expect(sumPeriod([]).rate).toBeNull()
  })
  it('gives the percentage change, or null with nothing to compare', () => {
    expect(deltaPercent(115.5, 100)).toBe(15.5)
    expect(deltaPercent(80, 100)).toBe(-20)
    expect(deltaPercent(50, 0)).toBeNull()
    expect(deltaPercent(-50, -100)).toBe(50)
  })
})
