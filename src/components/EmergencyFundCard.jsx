import { useState } from 'react'
import Button from './Button.jsx'
import Card from './Card.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { errorMessage } from '../lib/db.js'
import { formatINR, parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

export default function EmergencyFundCard({ goal, banks, balance, target, averages, partial, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [accountId, setAccountId] = useState(goal?.account_id || '')
  const [override, setOverride] = useState(goal?.target_amount ? String(goal.target_amount) : '')
  const [first, setFirst] = useState(goal?.emergency_first ?? true)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const form = !goal || editing

  async function save(e) {
    e.preventDefault()
    const found = {}
    if (!accountId) found.account = 'Choose the bank account that holds your emergency fund.'
    const amount = override.trim() ? parseAmount(override) : null
    if (override.trim() && !(amount > 0)) found.override = 'Enter an amount above 0, or leave it empty.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const row = { account_id: accountId, target_amount: amount, emergency_first: first }
    const { error: err } = goal
      ? await supabase.from('goals').update(row).eq('id', goal.id)
      : await supabase.from('goals').insert({ ...row, kind: 'emergency', name: 'Emergency fund' })
    setBusy(false)
    if (err) return setError(errorMessage(err))
    setEditing(false)
    onChanged()
  }

  const percent = target.amount ? Math.min(100, Math.round((balance / target.amount) * 100)) : 0
  const shortfall = target.amount ? Math.max(target.amount - balance, 0) : 0

  return (
    <Card title="Emergency fund" actions={goal && !editing ? <Button size="small" onClick={() => setEditing(true)}>Change</Button> : null}>
      {form ? (
        <form className="stack" onSubmit={save} noValidate>
          <Notice kind="error">{error}</Notice>
          {banks.length === 0 && <Notice kind="info">Add a bank account first. You can create one just for your emergency money.</Notice>}
          <SelectField label="Bank account that holds it" value={accountId} onChange={(e) => setAccountId(e.target.value)} error={errors.account}>
            <option value="">Choose a bank account</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </SelectField>
          <TextField
            label="Your own target (₹, optional)" inputMode="decimal" value={override} onChange={(e) => setOverride(e.target.value)}
            error={errors.override} hint="Leave empty to use 6 months of your average spending."
          />
          <div className="check">
            <input id="ef-first" type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} />
            <label htmlFor="ef-first">Fill the emergency fund before bucket-list items</label>
          </div>
          <div className="row-actions">
            <Button type="submit" variant="primary" busy={busy}>Save</Button>
            {goal && <Button onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </form>
      ) : (
        <div className="stack">
          {target.amount ? (
            <>
              <div className="progress" role="progressbar" aria-label="Emergency fund progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <div style={{ width: `${percent}%` }} />
              </div>
              <p>
                <strong><MoneyText value={balance} /></strong> of <MoneyText value={target.amount} /> ({percent}%).{' '}
                {shortfall > 0 ? <>Still needed: <MoneyText value={shortfall} />.</> : 'Your emergency fund is full.'}
              </p>
              <p className="muted">
                {target.suggested
                  ? `Target is 6 months of your average spending (${formatINR(averages?.spending)} a month${partial ? ', so far this month' : ''}).`
                  : 'Target is the amount you set.'}
              </p>
            </>
          ) : (
            <Notice kind="info">Add some entries so the app can suggest a target, or set your own target with Change.</Notice>
          )}
        </div>
      )}
    </Card>
  )
}
