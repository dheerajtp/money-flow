import { useState } from 'react'
import Button from './Button.jsx'
import Card from './Card.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import useSession from '../hooks/useSession.js'
import { errorMessage } from '../lib/db.js'
import { buildSettingsRow, formFromSettings, suggestFloor, validateSettingsForm } from '../lib/planner/settingsForm.js'
import { supabase } from '../lib/supabase.js'

// Spending account (bank only), salary category, salary day, expected salary and minimum balance.
export default function PlannerSetupForm({ settings, accounts, categories, onSaved, onCancel }) {
  const { session } = useSession()
  const [f, setF] = useState(() => formFromSettings(settings))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const banks = accounts.filter((a) => a.type === 'bank' && !a.archived_at)
  const incomeCategories = categories.filter((c) => c.kind === 'income')
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))
  const suggested = suggestFloor(f.expectedSalary)

  async function submit(e) {
    e.preventDefault()
    const found = validateSettingsForm(f, { bankIds: banks.map((a) => a.id), incomeCategoryIds: incomeCategories.map((c) => c.id) })
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const { error: err } = await supabase.from('planner_settings').upsert(buildSettingsRow(f, session.user.id), { onConflict: 'user_id' })
    setBusy(false)
    if (err) return setError(errorMessage(err))
    onSaved()
  }

  return (
    <Card title="Planner settings">
      <form className="stack" onSubmit={submit} noValidate>
        <Notice kind="error">{error}</Notice>
        <div className="row">
          <SelectField label="Spending account" value={f.spendingAccountId} onChange={set('spendingAccountId')} error={errors.spendingAccountId} hint="The bank account your salary lands in and your bills leave from.">
            <option value="">Choose an account</option>
            {banks.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
          <SelectField label="Salary category" value={f.salaryCategoryId} onChange={set('salaryCategoryId')} error={errors.salaryCategoryId} hint="Your pay period starts from the latest income entry in this category.">
            <option value="">None (use the salary day)</option>
            {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        </div>
        <div className="row">
          <TextField label="Salary day of month" inputMode="numeric" value={f.salaryDay} onChange={set('salaryDay')} error={errors.salaryDay} hint="Days after the month's end use its last day." />
          <TextField label="Expected salary (₹, optional)" inputMode="decimal" value={f.expectedSalary} onChange={set('expectedSalary')} error={errors.expectedSalary} />
          <TextField
            label="Minimum balance to keep (₹)"
            inputMode="decimal"
            value={f.floor}
            onChange={set('floor')}
            error={errors.floor}
            hint={suggested === null ? 'Money you never plan to spend.' : `Suggested ${suggested} (10% of your expected salary).`}
            endSlot={suggested === null ? null : <Button size="small" onClick={() => setF((s) => ({ ...s, floor: String(suggested) }))}>Use</Button>}
          />
        </div>
        <div className="row-actions">
          <Button variant="primary" type="submit" busy={busy}>Save</Button>
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Card>
  )
}
