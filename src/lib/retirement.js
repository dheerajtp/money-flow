import { clampDate, monthsBetween, parseISO } from './dates.js'

// The date a person reaches the retirement age.
export function retirementDate(dobISO, retirementAge) {
  const { y, m, d } = parseISO(dobISO)
  return clampDate(y + retirementAge, m, d)
}

export function ageOn(dobISO, onISO) {
  const dob = parseISO(dobISO)
  const on = parseISO(onISO)
  let age = on.y - dob.y
  if (on.m < dob.m || (on.m === dob.m && on.d < dob.d)) age -= 1
  return age
}

// Whole months until retirement; 0 once the date has passed.
export function monthsToRetirement(dobISO, retirementAge, todayISO) {
  const target = retirementDate(dobISO, retirementAge)
  if (target <= todayISO) return 0
  const months = monthsBetween(todayISO, target)
  const t = parseISO(target)
  const n = parseISO(todayISO)
  return t.d < n.d ? months - 1 : months
}

export function yearsToRetirement(dobISO, retirementAge, todayISO) {
  return monthsToRetirement(dobISO, retirementAge, todayISO) / 12
}

// Age in whole months on a given date.
export function ageInMonths(dobISO, onISO) {
  const months = monthsBetween(dobISO, onISO)
  return parseISO(onISO).d < parseISO(dobISO).d ? months - 1 : months
}
