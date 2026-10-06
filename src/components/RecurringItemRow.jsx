import { useState } from 'react'
import Button from './Button.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { formatDate, todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

const KIND = { subscription: 'Subscription', emi: 'Loan EMI', insurance: 'Insurance' }
const STATUS = { active: 'Active', paused: 'Paused', ended: 'Ended' }

export default function RecurringItemRow({ item, amount, nextDue, payerName, onEdit, onChanged }) {
  const [confirming, setConfirming] = useState(null) // 'end' | 'delete'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function update(patch) {
    setError('')
    const { error: err } = await supabase.from('recurring_items').update(patch).eq('id', item.id)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  async function confirm() {
    setBusy(true)
    const { error: err } = confirming === 'end'
      ? await supabase.from('recurring_items').update({ status: 'ended', end_date: todayISO() }).eq('id', item.id)
      : await supabase.from('recurring_items').delete().eq('id', item.id)
    setBusy(false)
    setConfirming(null)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  return (
    <li>
      <div className="grow">
        <div className="title">{item.name} <span className="badge">{KIND[item.kind]}</span> <span className={`badge ${item.status === 'active' ? 'badge-info' : ''}`}>{STATUS[item.status]}</span></div>
        <div className="muted">
          Paid from {payerName}
          {item.status === 'active' && nextDue ? ` · next due ${formatDate(nextDue)}` : ''}
          {item.status === 'ended' && item.end_date ? ` · ended ${formatDate(item.end_date)}` : ''}
        </div>
        <Notice kind="error">{error}</Notice>
      </div>
      <div>{amount ? <MoneyText value={amount} /> : null}</div>
      <div className="row-actions">
        {item.status !== 'ended' && <Button size="small" onClick={() => onEdit(item)}>Edit</Button>}
        {item.status === 'active' && <Button size="small" onClick={() => update({ status: 'paused' })}>Pause</Button>}
        {item.status === 'paused' && <Button size="small" onClick={() => update({ status: 'active', generated_through: todayISO() })}>Resume</Button>}
        {item.status !== 'ended' && <Button size="small" onClick={() => setConfirming('end')}>End</Button>}
        <Button size="small" variant="danger" onClick={() => setConfirming('delete')}>Delete</Button>
      </div>
      <ConfirmModal
        open={Boolean(confirming)}
        title={confirming === 'end' ? `End ${item.name}?` : `Delete ${item.name}?`}
        message={confirming === 'end'
          ? 'No more payments will be estimated. Past entries stay as they are.'
          : 'The recurring payment is removed. Entries already created stay in your ledger.'}
        confirmLabel={confirming === 'end' ? 'End it' : 'Delete'}
        danger
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      />
    </li>
  )
}
