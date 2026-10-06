import { addMonths, monthStart } from './dates.js'
import { lastEmiDate, monthsLeft } from './loans.js'
import { ageInMonths, ageOn, monthsToRetirement, retirementDate } from './retirement.js'

export const DEFAULT_SETTINGS = { multiplier: 25, annualReturn: 0.1, inflation: 0.06 }
export const MAX_AGE = 80

// ---- Part 1: debt-free -------------------------------------------------
// loans: accounts of type loan. cards: [{ name, owed }].
export function debtSummary({ loans, cards, today }) {
  const active = loans
    .map((a) => ({
      id: a.id,
      name: a.name,
      emi: Number(a.details.emi_amount),
      monthsLeft: monthsLeft(a.details, today),
      lastEmi: lastEmiDate(a.details),
    }))
    .map((l) => ({ ...l, totalLeft: l.emi * l.monthsLeft }))
    .filter((l) => l.monthsLeft > 0)
  const cardsOwed = cards.reduce((s, c) => s + Math.max(c.owed, 0), 0)
  const loansOwed = active.reduce((s, l) => s + l.totalLeft, 0)
  const lastLoanMonth = active.length ? active.map((l) => l.lastEmi).sort().pop() : null
  return {
    loans: active,
    cards: cards.filter((c) => c.owed > 0),
    totalDebt: loansOwed + cardsOwed,
    cardsOwed,
    loansOwed,
    debtFree: active.length === 0 && cardsOwed === 0,
    loansClearBy: lastLoanMonth,
    // The date is only known when no card balance is owed.
    debtFreeDate: cardsOwed === 0 ? lastLoanMonth : null,
  }
}

// ---- Part 2: freedom by retirement age ---------------------------------
function growth(startValue, monthly, months, annualReturn) {
  const rm = Math.pow(1 + annualReturn, 1 / 12) - 1
  if (rm === 0) return startValue + monthly * months
  const f = Math.pow(1 + rm, months)
  return startValue * f + (monthly * (f - 1)) / rm
}

function annuityFactor(months, annualReturn) {
  const rm = Math.pow(1 + annualReturn, 1 / 12) - 1
  return rm === 0 ? months : (Math.pow(1 + rm, months) - 1) / rm
}

// EMIs still running in the month of `dateISO`.
function runningEmis(loans, dateISO) {
  const from = monthStart(dateISO)
  return loans.filter((l) => monthStart(l.lastEmi) >= from).reduce((s, l) => s + l.emi, 0)
}

function targetAt({ livingMonthly, loans, months, atDateISO, settings }) {
  const inflated = livingMonthly * 12 * Math.pow(1 + settings.inflation, months / 12)
  const emis = runningEmis(loans, atDateISO) * 12
  return settings.multiplier * (inflated + emis)
}

// Everything is an estimate based on the assumptions in `settings`.
export function retirementProjection({ dob, retirementAge, today, livingMonthly, loans, investedNow, monthlyInvesting, settings }) {
  const n = monthsToRetirement(dob, retirementAge, today)
  const retireOn = retirementDate(dob, retirementAge)
  const target = targetAt({ livingMonthly, loans, months: n, atDateISO: retireOn, settings })
  const projected = growth(investedNow, monthlyInvesting, n, settings.annualReturn)
  const gap = target - projected
  const factor = annuityFactor(n, settings.annualReturn)
  const extraMonthly = gap > 0 && n > 0 ? gap / factor : gap > 0 ? null : 0

  // Earliest age at which projected savings reach that month's target.
  let freedomAge = null
  const startAge = ageOn(dob, today)
  const limit = Math.max((MAX_AGE - startAge) * 12, 0)
  for (let k = 0; k <= limit; k++) {
    const date = addMonths(today, k)
    const t = targetAt({ livingMonthly, loans, months: k, atDateISO: date, settings })
    if (growth(investedNow, monthlyInvesting, k, settings.annualReturn) >= t) {
      const total = ageInMonths(dob, date)
      freedomAge = { years: Math.floor(total / 12), months: total % 12, date }
      break
    }
  }

  return {
    months: n,
    retireOn,
    alreadyReached: retireOn <= today,
    target,
    projected,
    gap,
    onTrack: projected >= target,
    extraMonthly,
    freedomAge,
  }
}

// Points for the chart: projected savings vs the (inflated) target, every 6 months.
export function projectionSeries({ dob, retirementAge, today, livingMonthly, loans, investedNow, monthlyInvesting, settings }) {
  const n = monthsToRetirement(dob, retirementAge, today)
  const points = []
  for (let k = 0; k <= n; k += 6) points.push(k)
  if (points[points.length - 1] !== n) points.push(n)
  return points.map((k) => {
    const date = addMonths(today, k)
    return {
      date,
      projected: growth(investedNow, monthlyInvesting, k, settings.annualReturn),
      target: targetAt({ livingMonthly, loans, months: k, atDateISO: date, settings }),
    }
  })
}
