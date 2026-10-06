import { useState } from 'react'
import Button from './Button.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { formatDate } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

export default function SuggestionCard({ suggestion, onAccept, onChanged }) {
  const [error, setError] = useState('')

  async function dismiss() {
    const { error: err } = await supabase.from('recurring_suggestions').update({ status: 'dismissed' }).eq('id', suggestion.id)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  return (
    <li>
      <div className="grow">
        <div className="title">{suggestion.name}</div>
        <div className="muted">
          {suggestion.source === 'mandate' ? 'Upcoming auto-payment from a message you pasted' : 'Paid regularly in different months'}
          {suggestion.due_date ? ` · ${formatDate(suggestion.due_date)}` : ''}
        </div>
        <Notice kind="error">{error}</Notice>
      </div>
      <div><MoneyText value={suggestion.amount} /></div>
      <div className="row-actions">
        <Button size="small" variant="primary" onClick={() => onAccept(suggestion)}>Track it</Button>
        <Button size="small" onClick={dismiss}>Dismiss</Button>
      </div>
    </li>
  )
}
