import { useState } from 'react'
import Button from './Button.jsx'
import DraftCard from './DraftCard.jsx'
import Notice from './Notice.jsx'
import { isComplete } from '../lib/capture.js'
import { errorMessage } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

export default function DraftList({ drafts, accounts, categories, onChanged, onConfirmed }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const complete = drafts.filter(isComplete)

  async function confirmAll() {
    setBusy(true)
    setError('')
    setMessage('')
    const results = []
    let failed = 0
    for (const d of complete) {
      const { data, error: err } = await supabase.rpc('confirm_draft', { p_id: d.id })
      if (err) {
        failed += 1
        setError(errorMessage(err))
      } else results.push(data)
    }
    setBusy(false)
    setMessage(`Confirmed ${results.length} draft${results.length === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}.`)
    onConfirmed(results)
  }

  return (
    <div className="stack">
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{message}</Notice>
      <div className="row-actions">
        <Button variant="primary" onClick={confirmAll} busy={busy} disabled={complete.length === 0}>
          Confirm all complete drafts ({complete.length})
        </Button>
        {complete.length < drafts.length && <span className="muted">{drafts.length - complete.length} still need details.</span>}
      </div>
      <ul className="list">
        {drafts.map((d) => (
          <DraftCard key={`${d.id}-${d.updated_at}`} draft={d} accounts={accounts} categories={categories} onChanged={onChanged} onConfirmed={onConfirmed} />
        ))}
      </ul>
    </div>
  )
}
