import { useState } from 'react'
import Button from './Button.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { formatDate, formatMonth } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

export default function BucketItem({ item, projected, noSavings, index, count, onMove, onEdit, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function setStatus(status) {
    const { error: err } = await supabase.from('goals').update({ status }).eq('id', item.id)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  async function remove() {
    setBusy(true)
    const { error: err } = await supabase.from('goals').delete().eq('id', item.id)
    setBusy(false)
    setConfirming(false)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  const remaining = Math.max(Number(item.target_amount) - Number(item.saved_so_far), 0)
  let when = null
  if (noSavings) when = 'No savings left each month yet, so there is no date.'
  else if (projected) when = remaining === 0 ? 'You have saved enough.' : `Could be bought around ${formatMonth(projected.completion)}.`

  return (
    <li>
      <div className="grow">
        <div className="title">{index + 1}. {item.name}</div>
        <div className="muted">
          Saved {formatINR(item.saved_so_far)}, still needed {formatINR(remaining)}
          {item.target_date ? ` · wanted by ${formatDate(item.target_date)}` : ''}
        </div>
        {when && <div>{when}</div>}
        {projected?.neededPerMonth !== undefined && remaining > 0 && (
          <div className="muted">
            To buy it by {formatDate(item.target_date)}, put aside {formatINR(projected.neededPerMonth)} a month
            {' · '}
            {projected.onTrack ? <span className="badge badge-info">On track</span> : <span className="badge badge-warning">Behind</span>}
          </div>
        )}
        {item.note && <div className="muted">{item.note}</div>}
        <Notice kind="error">{error}</Notice>
      </div>
      <div className="money"><MoneyText value={item.target_amount} /></div>
      <div className="row-actions">
        <Button size="small" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${item.name} up`}>Up</Button>
        <Button size="small" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${item.name} down`}>Down</Button>
        <Button size="small" onClick={() => onEdit(item)}>Edit</Button>
        <Button size="small" onClick={() => setStatus('bought')}>Mark as bought</Button>
        <Button size="small" onClick={() => setStatus('archived')}>Archive</Button>
        <Button size="small" variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
      </div>
      <ConfirmModal
        open={confirming}
        title={`Delete ${item.name}?`}
        message="It will be removed from your bucket list for good. Marking it as bought keeps it in your history instead."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </li>
  )
}
