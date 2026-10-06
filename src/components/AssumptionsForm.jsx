import { useState } from 'react'
import Button from './Button.jsx'
import Card from './Card.jsx'
import Notice from './Notice.jsx'
import TextField from './TextField.jsx'
import useSession from '../hooks/useSession.js'
import { errorMessage } from '../lib/db.js'
import { DEFAULT_SETTINGS } from '../lib/freedom.js'
import { parseAmount } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

const pct = (v) => String(Math.round(v * 10000) / 100)

export default function AssumptionsForm({ settings, onSaved }) {
  const { session } = useSession()
  const [f, setF] = useState({ multiplier: String(settings.multiplier), annualReturn: pct(settings.annualReturn), inflation: pct(settings.inflation) })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const m = parseAmount(f.multiplier)
    const r = parseAmount(f.annualReturn)
    const i = parseAmount(f.inflation)
    const found = {}
    if (m === null || m < 10 || m > 60) found.multiplier = 'Enter a number from 10 to 60.'
    if (r === null || r < 0 || r > 30) found.annualReturn = 'Enter a percentage from 0 to 30.'
    if (i === null || i < 0 || i > 20) found.inflation = 'Enter a percentage from 0 to 20.'
    setErrors(found)
    setSaved(false)
    if (Object.keys(found).length) return
    setBusy(true)
    setError('')
    const { error: err } = await supabase.from('freedom_settings').upsert(
      { user_id: session.user.id, multiplier: m, annual_return: r / 100, inflation: i / 100 },
      { onConflict: 'user_id' },
    )
    setBusy(false)
    if (err) return setError(errorMessage(err))
    setSaved(true)
    onSaved()
  }

  function reset() {
    setF({ multiplier: String(DEFAULT_SETTINGS.multiplier), annualReturn: pct(DEFAULT_SETTINGS.annualReturn), inflation: pct(DEFAULT_SETTINGS.inflation) })
    setErrors({})
  }

  return (
    <Card title="Assumptions">
      <form className="stack" onSubmit={submit} noValidate>
        <Notice kind="error">{error}</Notice>
        <Notice kind="success">{saved ? 'Assumptions saved.' : ''}</Notice>
        <div className="row">
          <TextField label="Spending multiplier" inputMode="decimal" value={f.multiplier} onChange={set('multiplier')} error={errors.multiplier} hint="Freedom number = yearly spending × this. 25 is the common 4% rule." />
          <TextField label="Yearly return on investments (%)" inputMode="decimal" value={f.annualReturn} onChange={set('annualReturn')} error={errors.annualReturn} />
          <TextField label="Yearly inflation on spending (%)" inputMode="decimal" value={f.inflation} onChange={set('inflation')} error={errors.inflation} />
        </div>
        <div className="row-actions">
          <Button type="submit" variant="primary" busy={busy}>Save assumptions</Button>
          <Button onClick={reset}>Use the defaults</Button>
        </div>
      </form>
    </Card>
  )
}
