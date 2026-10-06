import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import TextField from './TextField.jsx'
import { errorMessage } from '../lib/db.js'
import { parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

export default function BucketItemForm({ item, nextPriority, onSaved, onCancel }) {
  const [f, setF] = useState({
    name: item?.name || '',
    price: item ? String(item.target_amount) : '',
    savedSoFar: item ? String(item.saved_so_far) : '0',
    targetDate: item?.target_date || '',
    note: item?.note || '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    const price = parseAmount(f.price)
    const saved = parseAmount(f.savedSoFar || '0')
    const found = {}
    if (!f.name.trim()) found.name = 'Enter what you want to buy.'
    if (!(price > 0)) found.price = 'Enter a price above 0.'
    if (saved === null || saved < 0) found.savedSoFar = 'Enter 0 or more.'
    else if (price > 0 && saved > price) found.savedSoFar = 'Saved so far cannot be more than the price.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const row = {
      name: f.name.trim(), target_amount: price, saved_so_far: saved,
      target_date: f.targetDate || null, note: f.note.trim() || null,
    }
    const { error: err } = item
      ? await supabase.from('goals').update(row).eq('id', item.id)
      : await supabase.from('goals').insert({ ...row, kind: 'bucket', priority: nextPriority })
    setBusy(false)
    if (err) setError(errorMessage(err))
    else onSaved()
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      <div className="row">
        <TextField label="What do you want to buy?" value={f.name} onChange={set('name')} error={errors.name} />
        <TextField label="Price (₹)" inputMode="decimal" value={f.price} onChange={set('price')} error={errors.price} />
      </div>
      <div className="row">
        <TextField label="Saved so far (₹)" inputMode="decimal" value={f.savedSoFar} onChange={set('savedSoFar')} error={errors.savedSoFar} />
        <TextField label="Buy by (optional)" type="date" value={f.targetDate} onChange={set('targetDate')} />
      </div>
      <TextField label="Note (optional)" value={f.note} onChange={set('note')} maxLength={500} />
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy}>{item ? 'Save changes' : 'Add to bucket list'}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
