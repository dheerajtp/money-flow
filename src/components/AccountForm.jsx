import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import {
  ACCOUNT_TYPES, FREQUENCIES, buildAccountRow, detailFields, emptyForm, hasLast4, openingLabel, validateAccount,
} from '../lib/accountFields.js'
import { errorMessage } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

export default function AccountForm({ editingId = null, initial, banks, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm('bank'))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const type = form.type
  // A debit card spends from a bank account, so there must be one to choose.
  const needsBank = type === 'debit_card' && banks.length === 0

  function changeType(e) {
    setForm(emptyForm(e.target.value))
    setErrors({})
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = validateAccount(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const row = buildAccountRow(form)
    const query = editingId
      ? supabase.from('accounts').update(row).eq('id', editingId)
      : supabase.from('accounts').insert(row)
    const { error: err } = await query
    setBusy(false)
    if (err) setError(errorMessage(err))
    else onSaved()
  }

  function renderDetail(f) {
    const common = { key: f.key, label: f.label, value: form[f.key], onChange: set(f.key), error: errors[f.key] }
    if (f.kind === 'frequency') {
      return (
        <SelectField {...common}>
          {FREQUENCIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectField>
      )
    }
    if (f.kind === 'day') return <TextField {...common} type="number" inputMode="numeric" min="1" max="31" />
    if (f.kind === 'month') return <TextField {...common} type="month" />
    if (f.kind === 'date') return <TextField {...common} type="date" />
    return <TextField {...common} inputMode="decimal" />
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      {!editingId && (
        <SelectField label="Type" value={type} onChange={changeType}>
          {Object.entries(ACCOUNT_TYPES).map(([value, t]) => <option key={value} value={value}>{t.label}</option>)}
        </SelectField>
      )}
      <div className="row">
        <TextField label="Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="For example HDFC Savings" />
        <TextField label="Bank or company (optional)" value={form.institution} onChange={set('institution')} />
      </div>
      {hasLast4(type) && (
        <TextField
          label="Last 4 digits (optional)" inputMode="numeric" maxLength={4} value={form.last4} onChange={set('last4')}
          error={errors.last4} hint="Used to match pasted bank messages to this account. Never enter the full number."
        />
      )}
      {type === 'debit_card' && (needsBank ? (
        <Notice kind="info">
          <p style={{ margin: '0 0 var(--space-2)' }}>A debit card spends from a bank account, and you have not added one yet. Add the bank account first, then come back for the card.</p>
          <Button size="small" onClick={() => { setForm((f) => ({ ...emptyForm('bank'), institution: f.institution })); setErrors({}) }}>Add the bank account first</Button>
        </Notice>
      ) : (
        <SelectField label="Spends from bank account" value={form.linked_account_id} onChange={set('linked_account_id')} error={errors.linked_account_id}>
          <option value="">Choose a bank account</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </SelectField>
      ))}
      {openingLabel(type) && (
        <TextField label={openingLabel(type)} inputMode="decimal" value={form.opening} onChange={set('opening')} error={errors.opening} />
      )}
      {detailFields(type).length > 0 && <div className="row">{detailFields(type).map(renderDetail)}</div>}
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy} disabled={needsBank}>{editingId ? 'Save changes' : 'Add account'}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
