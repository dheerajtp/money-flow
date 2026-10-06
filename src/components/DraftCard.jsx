import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { ACCOUNT_TYPES } from '../lib/accountFields.js'
import { isComplete } from '../lib/capture.js'
import { errorMessage } from '../lib/db.js'
import { formatINR, parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

function missing(d) {
  const out = []
  if (!d.account_id) out.push(d.kind === 'transfer' ? 'from account' : 'account')
  if (d.kind === 'transfer' && !d.to_account_id) out.push('to account')
  if (d.kind !== 'transfer' && !d.category_id) out.push('category')
  return out
}

export default function DraftCard({ draft, accounts, categories, onChanged, onConfirmed }) {
  const [f, setF] = useState({
    kind: draft.kind,
    account_id: draft.account_id || '',
    to_account_id: draft.to_account_id || '',
    category_id: draft.category_id || '',
    amount: String(draft.amount),
    entry_date: draft.entry_date,
    note: draft.note || '',
  })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))
  const isTransfer = f.kind === 'transfer'
  const amount = parseAmount(f.amount)
  const current = {
    kind: f.kind,
    account_id: f.account_id || null,
    to_account_id: isTransfer ? f.to_account_id || null : null,
    category_id: isTransfer ? null : f.category_id || null,
    amount,
    entry_date: f.entry_date,
    note: f.note.trim() || null,
  }
  const lacks = missing(current)

  function changeKind(e) {
    const kind = e.target.value
    setF((s) => ({ ...s, kind, category_id: '', to_account_id: kind === 'transfer' ? s.to_account_id : '' }))
  }

  async function save() {
    if (!(amount > 0)) throw new Error('Enter an amount above 0.')
    const { error: err } = await supabase.from('entries').update(current).eq('id', draft.id)
    if (err) throw err
  }

  async function onSave() {
    setBusy('save')
    setError('')
    try {
      await save()
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  async function onConfirm() {
    setBusy('confirm')
    setError('')
    try {
      await save()
      if (!isComplete(current)) throw new Error(`Choose the ${lacks.join(' and ')} first.`)
      const { data, error: err } = await supabase.rpc('confirm_draft', { p_id: draft.id })
      if (err) throw err
      if (draft.merchant_key) {
        await supabase.from('merchant_rules').upsert({
          merchant_key: draft.merchant_key,
          category_id: isTransfer ? null : current.category_id,
          transfer_to_account_id: isTransfer ? current.to_account_id : null,
        }, { onConflict: 'user_id,merchant_key' })
      }
      onConfirmed([data])
    } catch (err) {
      setError(errorMessage(err))
      setBusy('')
    }
  }

  async function onDiscard() {
    setBusy('discard')
    const { error: err } = await supabase.from('entries').delete().eq('id', draft.id).eq('status', 'draft')
    if (err) {
      setError(errorMessage(err))
      setBusy('')
    } else onChanged()
  }

  const kindCategories = categories.filter((c) => c.kind === f.kind && !c.archived_at)

  return (
    <li className="draft">
      <div className="stack">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <strong>{draft.note || 'No payee found'} · {formatINR(draft.amount)}</strong>
          {lacks.length > 0
            ? <span className="badge badge-warning">Needs: {lacks.join(', ')}</span>
            : <span className="badge badge-info">Ready to confirm</span>}
        </div>
        <Notice kind="error">{error}</Notice>
        <div className="row">
          <SelectField label="Kind" value={f.kind} onChange={changeKind}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </SelectField>
          <SelectField label={isTransfer ? 'From account' : 'Account'} value={f.account_id} onChange={set('account_id')}>
            <option value="">Choose an account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({ACCOUNT_TYPES[a.type].label})</option>)}
          </SelectField>
          {isTransfer ? (
            <SelectField label="To account" value={f.to_account_id} onChange={set('to_account_id')}>
              <option value="">Choose an account</option>
              {accounts.filter((a) => a.id !== f.account_id).map((a) => <option key={a.id} value={a.id}>{a.name} ({ACCOUNT_TYPES[a.type].label})</option>)}
            </SelectField>
          ) : (
            <SelectField label="Category" value={f.category_id} onChange={set('category_id')}>
              <option value="">Choose a category</option>
              {kindCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          )}
        </div>
        <div className="row">
          <TextField label="Amount (₹)" inputMode="decimal" value={f.amount} onChange={set('amount')} />
          <TextField label="Date" type="date" value={f.entry_date} onChange={set('entry_date')} />
          <TextField label="Note" value={f.note} onChange={set('note')} maxLength={500} />
        </div>
        {draft.raw_text && (
          <details>
            <summary>Original message</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{draft.raw_text}</pre>
          </details>
        )}
        <div className="row-actions">
          <Button variant="primary" onClick={onConfirm} busy={busy === 'confirm'} disabled={Boolean(busy)}>Confirm</Button>
          <Button onClick={onSave} busy={busy === 'save'} disabled={Boolean(busy)}>Save changes</Button>
          <Button variant="danger" onClick={onDiscard} busy={busy === 'discard'} disabled={Boolean(busy)}>Discard</Button>
        </div>
      </div>
    </li>
  )
}
