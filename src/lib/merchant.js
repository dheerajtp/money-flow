// A stable lowercase key for matching the same payee across messages.
export function normalizeMerchant(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9@.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

export function merchantLabel(key) {
  return String(key ?? '')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}
