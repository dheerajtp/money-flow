import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import TextField from './TextField.jsx'
import { errorMessage } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

// Record how much a SIP or stock account is worth on a date.
export default function ValueUpdateForm({ account, onSaved, onCancel }) {
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    const amount = parseAmount(value)
    if (amount === null || amount < 0) {
      setFieldError('Enter 0 or more.')
      return
    }
    setFieldError('')
    setBusy(true)
    const { error: err } = await supabase
      .from('account_values')
      .upsert({ account_id: account.id, as_of: date, value: amount }, { onConflict: 'account_id,as_of' })
    setBusy(false)
    if (err) setError(errorMessage(err))
    else onSaved()
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      <div className="row">
        <TextField label="How much it is worth now (₹)" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} error={fieldError} />
        <TextField label="As of" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy}>Save value</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
