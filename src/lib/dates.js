// All dates are ISO strings 'YYYY-MM-DD' (no time zones involved).
export const pad = (n) => String(n).padStart(2, '0')

export function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return { y, m, d }
}

// The user's local calendar date (not UTC).
export function todayISO(now = new Date()) {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function clampDate(y, m, d) {
  return toISO(y, m, Math.min(d, daysInMonth(y, m)))
}

// Same rule as nth_month_date() in the database.
export function nthMonthDate(baseISO, k, day) {
  const { y, m } = parseISO(baseISO)
  const idx = y * 12 + (m - 1) + k
  return clampDate(Math.floor(idx / 12), (idx % 12) + 1, day)
}

export function addMonths(iso, k) {
  return nthMonthDate(iso, k, parseISO(iso).d)
}

export function monthStart(iso) {
  const { y, m } = parseISO(iso)
  return toISO(y, m, 1)
}

export function monthEnd(iso) {
  const { y, m } = parseISO(iso)
  return toISO(y, m, daysInMonth(y, m))
}

export function addDays(iso, n) {
  const { y, m, d } = parseISO(iso)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return toISO(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

export function daysBetween(aISO, bISO) {
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}

// Whole calendar months from a's month to b's month (b later = positive).
export function monthsBetween(aISO, bISO) {
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  return (b.y - a.y) * 12 + (b.m - a.m)
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatDate(iso) {
  if (!iso) return ''
  const { y, m, d } = parseISO(iso)
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d)))
}

export function formatMonth(iso) {
  if (!iso) return ''
  const { y, m } = parseISO(iso)
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 1)))
}
