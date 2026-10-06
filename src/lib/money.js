const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function formatINR(value) {
  return inr.format(Number(value) || 0)
}

// Rupees without paise, for tight spaces like tiles.
export function formatINRWhole(value) {
  return inrWhole.format(Number(value) || 0)
}

// "1,00,481.76", "₹ 500" or 500 -> number; anything else -> null.
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null
  const cleaned = String(input ?? '').replace(/[₹,\s]|rs\.?|inr/gi, '')
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  return Number(cleaned)
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}
