import { useState } from 'react'
import ConfirmModal from './ConfirmModal.jsx'
import { errorMessage } from '../lib/db.js'
import { formatINR } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

// "Netflix charged ₹649, expected ₹499. Update the recurring amount?"
export default function AmountChangePrompt({ change, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function update() {
    setBusy(true)
    const { error: err } = await supabase.from('recurring_items').update({ amount: change.actual }).eq('id', change.item_id)
    setBusy(false)
    if (err) setError(errorMessage(err))
    else onDone()
  }

  return (
    <ConfirmModal
      open
      title="Update the recurring amount?"
      message={`${change.name} charged ${formatINR(change.actual)}, but ${formatINR(change.expected)} was expected.${error ? ` ${error}` : ''}`}
      confirmLabel={`Use ${formatINR(change.actual)} from now on`}
      cancelLabel={`Keep ${formatINR(change.expected)}`}
      busy={busy}
      onConfirm={update}
      onCancel={onDone}
    />
  )
}
