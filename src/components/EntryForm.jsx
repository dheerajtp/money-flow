import { useState } from 'react'
import Button from './Button.jsx'
import EntryItemsEditor from './EntryItemsEditor.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { ACCOUNT_TYPES } from '../lib/accountFields.js'
import { errorMessage } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

const KINDS = [
  ['expense', 'Expense'],
  ['income', 'Income'],
  ['transfer', 'Transfer'],
]

function initialState(initial) {
  return {
    kind: initial?.kind || 'expense',
    accountId: initial?.account_id || '',
    toAccountId: initial?.to_account_id || '',
    amount: initial?.amount ? String(initial.amount) : '',
    date: initial?.entry_date || todayISO(),
    categoryId: initial?.category_id || '',
    note: initial?.note || '',
    items: (initial?.entry_items || []).map((i) => ({ name: i.name, amount: String(i.amount) })),
  }
}

export default function EntryForm({ accounts, categories, initial, onSaved, onCancel }) {
  const editingId = initial?.id || null
  const [f, setF] = useState(() => initialState(initial))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))
  const isTransfer = f.kind === 'transfer'
  const kindCategories = categories.filter((c) => c.kind === f.kind && !c.archived_at)
  const category = categories.find((c) => c.id === f.categoryId)
  const showItems = f.kind === 'expense' && category?.has_items

  function setKind(kind) {
    setF((s) => ({ ...s, kind, categoryId: '', toAccountId: kind === 'transfer' ? s.toAccountId : '', items: [] }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const found = {}
    const amount = parseAmount(f.amount)
    if (amount === null || amount <= 0) found.amount = 'Enter an amount above 0.'
    if (!f.accountId) found.accountId = isTransfer ? 'Choose where the money comes from.' : 'Choose an account.'
    if (isTransfer) {
      if (!f.toAccountId) found.toAccountId = 'Choose where the money goes.'
      else if (f.toAccountId === f.accountId) found.toAccountId = 'Choose a different account.'
    } else if (!f.categoryId) found.categoryId = 'Choose a category.'
    if (!f.date) found.date = 'Choose a date.'
    const items = showItems ? f.items.filter((i) => i.name.trim() || i.amount.trim()) : []
    const itemsTotal = items.reduce((s, i) => s + (parseAmount(i.amount) || 0), 0)
    if (items.some((i) => !i.name.trim() || !(parseAmount(i.amount) > 0))) found.items = 'Each item needs a name and an amount above 0.'
    else if (amount && itemsTotal > amount) found.items = 'The items add up to more than the entry amount.'
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    setError('')
    const payload = {
      account_id: f.accountId,
      to_account_id: isTransfer ? f.toAccountId : null,
      kind: f.kind,
      amount,
      entry_date: f.date,
      category_id: isTransfer ? null : f.categoryId,
      note: f.note.trim() || null,
    }
    try {
      let entryId = editingId
      const oldTotal = (initial?.entry_items || []).reduce((s, i) => s + Number(i.amount), 0)
      if (editingId) {
        if (amount < oldTotal) await run(supabase.from('entry_items').delete().eq('entry_id', editingId))
        await run(supabase.from('entries').update(payload).eq('id', editingId))
        await run(supabase.from('entry_items').delete().eq('entry_id', editingId))
      } else {
        const { data, error: err } = await supabase.from('entries').insert(payload).select('id').single()
        if (err) throw err
        entryId = data.id
      }
      if (items.length) {
        await run(supabase.from('entry_items').insert(items.map((i) => ({ entry_id: entryId, name: i.name.trim(), amount: parseAmount(i.amount) }))))
      }
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      <fieldset className="segmented" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">Kind of entry</legend>
        {KINDS.map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="kind" value={value} checked={f.kind === value} onChange={() => setKind(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="row">
        <SelectField label={isTransfer ? 'From account' : 'Account'} value={f.accountId} onChange={set('accountId')} error={errors.accountId}>
          <option value="">Choose an account</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({ACCOUNT_TYPES[a.type].label})</option>)}
        </SelectField>
        {isTransfer && (
          <SelectField label="To account" value={f.toAccountId} onChange={set('toAccountId')} error={errors.toAccountId}>
            <option value="">Choose an account</option>
            {accounts.filter((a) => a.id !== f.accountId).map((a) => <option key={a.id} value={a.id}>{a.name} ({ACCOUNT_TYPES[a.type].label})</option>)}
          </SelectField>
        )}
      </div>
      <div className="row">
        <TextField label="Amount (₹)" inputMode="decimal" value={f.amount} onChange={set('amount')} error={errors.amount} />
        <TextField label="Date" type="date" value={f.date} onChange={set('date')} error={errors.date} />
        {!isTransfer && (
          <SelectField label="Category" value={f.categoryId} onChange={set('categoryId')} error={errors.categoryId}>
            <option value="">Choose a category</option>
            {kindCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        )}
      </div>
      <TextField label="Note (optional)" value={f.note} onChange={set('note')} maxLength={500} />
      {showItems && <EntryItemsEditor items={f.items} onChange={(items) => setF((s) => ({ ...s, items }))} amount={parseAmount(f.amount)} error={errors.items} />}
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy}>{editingId ? 'Save changes' : 'Add entry'}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

async function run(promise) {
  const { error } = await promise
  if (error) throw error
}
