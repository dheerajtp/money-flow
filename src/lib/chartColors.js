// Colours that stay readable on white. Charts also label every series
// and offer a table, so colour is never the only signal.
export const CHART = {
  accent: '#1a1a1a',
  income: '#166534',
  expense: '#9b9b9b',
  danger: '#b42318',
  slate: '#cfcfcf',
  grey: '#4b5563',
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
export const compactINR = (n) => `₹${compact.format(Number(n) || 0)}`
