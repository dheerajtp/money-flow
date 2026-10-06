import { addMonths, monthEnd, monthStart, monthsBetween, todayISO as today } from './dates.js'

export const RANGE_OPTIONS = [
  { key: 'this', label: 'This month' },
  { key: 'last3', label: 'Last 3 months' },
  { key: 'last6', label: 'Last 6 months' },
  { key: 'last12', label: 'Last 12 months' },
  { key: 'custom', label: 'Custom' },
]

export const MAX_CUSTOM_MONTHS = 36

// "Last N months" means the N most recent FULL calendar months.
export function rangeFor(key, todayStr = today(), custom = {}) {
  const thisStart = monthStart(todayStr)
  if (key === 'this') return { from: thisStart, to: todayStr }
  const n = { last3: 3, last6: 6, last12: 12 }[key]
  if (n) return { from: addMonths(thisStart, -n), to: monthEnd(addMonths(thisStart, -1)) }
  if (key === 'custom') {
    const { from, to } = custom
    if (!from || !to) return { error: 'Choose both dates.' }
    if (from > to) return { error: 'The start date must not be after the end date.' }
    if (monthsBetween(from, to) >= MAX_CUSTOM_MONTHS) return { error: `Choose at most ${MAX_CUSTOM_MONTHS} months.` }
    return { from, to }
  }
  return { error: 'Unknown range.' }
}
