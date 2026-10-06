import { nthMonthDate, monthsBetween } from './dates.js'

// Every EMI date of a loan account's details (same rule as the database).
export function emiDates(details) {
  const count = monthsBetween(details.first_emi_month, details.last_emi_month)
  const dates = []
  for (let k = 0; k <= count; k++) {
    dates.push(nthMonthDate(details.first_emi_month, k, Number(details.emi_day)))
  }
  return dates
}

export function monthsLeft(details, asOfISO) {
  return emiDates(details).filter((d) => d > asOfISO).length
}

export function lastEmiDate(details) {
  const dates = emiDates(details)
  return dates[dates.length - 1]
}

export function loanOwed(details, asOfISO) {
  return monthsLeft(details, asOfISO) * Number(details.emi_amount)
}
