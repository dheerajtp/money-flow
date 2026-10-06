import { parseAmount } from './money.js'

export const GROUPS = ['Assets', 'Investments', 'Liabilities', 'Cards and policies']

export const ACCOUNT_TYPES = {
  bank: { label: 'Bank account', group: 'Assets', icon: 'bank' },
  sip: { label: 'SIP', group: 'Investments', icon: 'trending' },
  stock: { label: 'Stocks', group: 'Investments', icon: 'chart' },
  credit_card: { label: 'Credit card', group: 'Liabilities', icon: 'card', liability: true },
  loan: { label: 'Loan', group: 'Liabilities', icon: 'loan', liability: true },
  debit_card: { label: 'Debit card', group: 'Cards and policies', icon: 'card' },
  insurance: { label: 'Insurance', group: 'Cards and policies', icon: 'shield' },
}

export const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

// Type-specific fields stored in accounts.details.
const DETAIL_FIELDS = {
  credit_card: [
    { key: 'credit_limit', label: 'Credit limit (₹)', kind: 'amount', min: 0 },
    { key: 'statement_day', label: 'Statement day of month', kind: 'day' },
    { key: 'due_day', label: 'Payment due day of month', kind: 'day' },
  ],
  loan: [
    { key: 'emi_amount', label: 'Monthly EMI, interest included (₹)', kind: 'amount', min: 0.01 },
    { key: 'emi_day', label: 'EMI day of month', kind: 'day' },
    { key: 'first_emi_month', label: 'First EMI month', kind: 'month' },
    { key: 'last_emi_month', label: 'Last EMI month', kind: 'month' },
  ],
  sip: [
    { key: 'monthly_amount', label: 'Monthly SIP amount (₹)', kind: 'amount', min: 0.01 },
    { key: 'sip_day', label: 'SIP day of month', kind: 'day' },
  ],
  insurance: [
    { key: 'premium_amount', label: 'Premium (₹)', kind: 'amount', min: 0.01 },
    { key: 'frequency', label: 'Premium frequency', kind: 'frequency' },
    { key: 'next_due_date', label: 'Next due date', kind: 'date' },
    { key: 'sum_assured', label: 'Sum assured (₹, optional)', kind: 'amount', min: 0, optional: true },
  ],
}

export function detailFields(type) {
  return DETAIL_FIELDS[type] || []
}

export function hasLast4(type) {
  return type === 'bank' || type === 'debit_card' || type === 'credit_card'
}

export function openingLabel(type) {
  if (type === 'bank') return 'Balance before your first entry (₹)'
  if (type === 'credit_card') return 'Amount owed right now (₹)'
  return null
}

export function emptyForm(type) {
  const form = { type, name: '', institution: '', last4: '', opening: '0', linked_account_id: '' }
  for (const f of detailFields(type)) form[f.key] = f.kind === 'frequency' ? 'monthly' : ''
  return form
}

// Edit form from a stored account row.
export function formFromAccount(account) {
  const form = emptyForm(account.type)
  form.name = account.name
  form.institution = account.institution || ''
  form.last4 = account.last4 || ''
  form.linked_account_id = account.linked_account_id || ''
  const opening = Number(account.opening_balance)
  form.opening = String(account.type === 'credit_card' ? -opening : opening)
  for (const f of detailFields(account.type)) {
    const v = account.details?.[f.key]
    if (v === undefined || v === null) continue
    form[f.key] = f.kind === 'month' ? String(v).slice(0, 7) : String(v)
  }
  return form
}

function isDay(v) {
  return /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 31
}

export function validateAccount(form) {
  const errors = {}
  const type = form.type
  if (!form.name.trim()) errors.name = 'Enter a name.'
  else if (form.name.trim().length > 80) errors.name = 'Use 80 characters or fewer.'
  if (form.last4 && !/^\d{4}$/.test(form.last4)) errors.last4 = 'Enter exactly 4 digits.'
  if (type === 'debit_card' && !form.linked_account_id) errors.linked_account_id = 'Choose the bank account it spends from.'
  if (type === 'bank') {
    if (parseAmount(form.opening) === null) errors.opening = 'Enter a number.'
  }
  if (type === 'credit_card') {
    const v = parseAmount(form.opening)
    if (v === null || v < 0) errors.opening = 'Enter the amount owed (0 or more).'
  }
  for (const f of detailFields(type)) {
    const v = String(form[f.key] ?? '').trim()
    if (f.optional && v === '') continue
    if (f.kind === 'amount') {
      const n = parseAmount(v)
      if (n === null || n < f.min || (f.min > 0 && n <= 0)) errors[f.key] = f.min > 0 ? 'Enter an amount above 0.' : 'Enter 0 or more.'
    } else if (f.kind === 'day') {
      if (!isDay(v)) errors[f.key] = 'Enter a day from 1 to 31.'
    } else if (f.kind === 'month' || f.kind === 'date') {
      if (!v) errors[f.key] = 'Choose a date.'
    } else if (f.kind === 'frequency') {
      if (!FREQUENCIES.some((o) => o.value === v)) errors[f.key] = 'Choose a frequency.'
    }
  }
  if (type === 'loan' && !errors.first_emi_month && !errors.last_emi_month && form.last_emi_month < form.first_emi_month) {
    errors.last_emi_month = 'The last EMI month must not be before the first.'
  }
  return errors
}

// Form values -> the row sent to the database.
export function buildAccountRow(form) {
  const type = form.type
  const details = {}
  for (const f of detailFields(type)) {
    const v = String(form[f.key] ?? '').trim()
    if (v === '') continue
    if (f.kind === 'amount') details[f.key] = parseAmount(v)
    else if (f.kind === 'day') details[f.key] = Number(v)
    else if (f.kind === 'month') details[f.key] = `${v}-01`
    else details[f.key] = v
  }
  let opening = 0
  if (type === 'bank') opening = parseAmount(form.opening)
  if (type === 'credit_card') opening = -parseAmount(form.opening)
  return {
    type,
    name: form.name.trim(),
    institution: form.institution.trim() || null,
    last4: hasLast4(type) && form.last4 ? form.last4 : null,
    opening_balance: opening,
    linked_account_id: type === 'debit_card' ? form.linked_account_id : null,
    details,
  }
}
