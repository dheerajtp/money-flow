import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

// Runs the recurring sync now. Safe to press repeatedly: nothing is created twice.
export default function RunNowButton({ onDone }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function run() {
    setBusy(true)
    setMessage('')
    setError('')
    const { data, error: err } = await supabase.rpc('sync_recurring', { p_as_of: todayISO() })
    setBusy(false)
    if (err) return setError(errorMessage(err))
    setMessage(`Added ${data.estimates_created} estimated entr${data.estimates_created === 1 ? 'y' : 'ies'} and ${data.suggestions_created} new suggestion${data.suggestions_created === 1 ? '' : 's'}.`)
    onDone()
  }

  return (
    <div className="stack">
      <div><Button onClick={run} busy={busy}>Run now</Button></div>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{message}</Notice>
    </div>
  )
}
