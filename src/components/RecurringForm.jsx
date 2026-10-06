import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { ACCOUNT_TYPES, FREQUENCIES } from '../lib/accountFields.js'
import { errorMessage } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { parseAmount } from '../lib/money.js'
import { normalizeMerchant } from '../lib/merchant.js'
import { supabase } from '../lib/supabase.js'

const KINDS = [
  ['subscription', 'Subscription'],
  ['emi', 'Loan EMI'],
  ['insurance', 'Insurance premium'],
]

// item: an existing recurring item to edit, or null. suggestion: a suggestion to prefill from.
export default function RecurringForm({ item, suggestion, accounts, items, onSaved, onCancel }) {
  const today = todayISO()
  const [f, setF] = useState(() => ({
    kind: item?.kind || 'subscription',
    name: item?.name || suggestion?.name || '',
    bankName: item?.merchant_key || suggestion?.merchant_key || '',
    amount: item?.amount ? String(item.amount) : suggestion ? String(suggestion.amount) : '',
    frequency: item?.frequency || 'monthly',
    firstDue: item?.first_due_date || suggestion?.due_date || today,
    trackFrom: item?.track_from || suggestion?.due_date || today,
    paying: item?.paying_account_id || suggestion?.account_id || '',
    linked: item?.linked_account_id || '',
  }))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))

  const payers = accounts.filter((a) => ['bank', 'debit_card', 'credit_card'].includes(a.type) && !a.archived_at)
  const taken = new Set(items.filter((i) => i.status !== 'ended' && i.id !== item?.id).map((i) => i.linked_account_id))
  const linkables = accounts.filter((a) => a.type === (f.kind === 'emi' ? 'loan' : 'insurance') && !a.archived_at && !taken.has(a.id))

  function pickLinked(e) {
    const id = e.target.value
    const acc = accounts.find((a) => a.id === id)
    setF((s) => ({
      ...s,
      linked: id,
      name: s.name || (acc ? `${acc.name} ${f.kind === 'emi' ? 'EMI' : 'premium'}` : ''),
      firstDue: acc ? (f.kind === 'emi' ? acc.details.first_emi_month : acc.details.next_due_date) : s.firstDue,
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = {}
    if (!f.name.trim()) found.name = 'Enter a name.'
    if (!f.paying) found.paying = 'Choose the account the money leaves.'
    if (f.kind === 'subscription') {
      if (!(parseAmount(f.amount) > 0)) found.amount = 'Enter an amount above 0.'
    } else if (!f.linked) found.linked = f.kind === 'emi' ? 'Choose the loan.' : 'Choose the insurance policy.'
    if (!f.firstDue) found.firstDue = 'Choose a date.'
    if (!f.trackFrom) found.trackFrom = 'Choose a date.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const row = {
      kind: f.kind,
      name: f.name.trim(),
      merchant_key: normalizeMerchant(f.bankName || f.name),
      paying_account_id: f.paying,
      linked_account_id: f.kind === 'subscription' ? null : f.linked,
      amount: f.kind === 'subscription' ? parseAmount(f.amount) : null,
      frequency: f.kind === 'subscription' ? f.frequency : null,
      first_due_date: f.firstDue,
      track_from: f.trackFrom,
    }
    const { error: err } = item
      ? await supabase.from('recurring_items').update(row).eq('id', item.id)
      : await supabase.from('recurring_items').insert(row)
    if (!err && suggestion) await supabase.from('recurring_suggestions').update({ status: 'accepted' }).eq('id', suggestion.id)
    setBusy(false)
    if (err) setError(err.code === '23505' ? 'That loan or policy is already being tracked.' : errorMessage(err))
    else onSaved()
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      {!item && !suggestion && (
        <SelectField label="What is it?" value={f.kind} onChange={(e) => setF((s) => ({ ...s, kind: e.target.value, linked: '' }))}>
          {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
      )}
      {f.kind !== 'subscription' && (
        <SelectField label={f.kind === 'emi' ? 'Loan' : 'Insurance policy'} value={f.linked} onChange={pickLinked} error={errors.linked} disabled={Boolean(item)}>
          <option value="">Choose one</option>
          {(item ? accounts.filter((a) => a.id === f.linked) : linkables).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </SelectField>
      )}
      <div className="row">
        <TextField label="Name" value={f.name} onChange={set('name')} error={errors.name} placeholder="For example Netflix" />
        {f.kind === 'subscription' && (
          <TextField label="Amount (₹)" inputMode="decimal" value={f.amount} onChange={set('amount')} error={errors.amount} />
        )}
      </div>
      {f.kind === 'subscription' && (
        <div className="row">
          <SelectField label="How often" value={f.frequency} onChange={set('frequency')}>
            {FREQUENCIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectField>
          <TextField label="Name in your bank message (optional)" value={f.bankName} onChange={set('bankName')} hint="Helps match the real payment, for example APPLE MEDIA SERVICES." />
        </div>
      )}
      {f.kind !== 'emi' && (
        <TextField label={f.kind === 'subscription' ? 'A due date' : 'First due date'} type="date" value={f.firstDue} onChange={set('firstDue')} error={errors.firstDue}
          hint={f.kind === 'subscription' ? 'The day of the month is repeated every cycle.' : undefined} />
      )}
      <div className="row">
        <SelectField label="Paid from" value={f.paying} onChange={set('paying')} error={errors.paying}>
          <option value="">Choose an account</option>
          {payers.map((a) => <option key={a.id} value={a.id}>{a.name} ({ACCOUNT_TYPES[a.type].label})</option>)}
        </SelectField>
        <TextField label="Start tracking from" type="date" value={f.trackFrom} onChange={set('trackFrom')} error={errors.trackFrom}
          hint="Nothing is added before this date." />
      </div>
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy}>{item ? 'Save changes' : 'Add recurring payment'}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
