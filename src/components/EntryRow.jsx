import { useState } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { formatDate } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

const KIND_LABEL = { income: 'Income', expense: 'Expense', transfer: 'Transfer' }
const KIND_ICON = { income: 'arrowDown', expense: 'arrowUp', transfer: 'swap' }

export default function EntryRow({ entry, accountName, toAccountName, categoryName, onEdit, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setBusy(true)
    const { error: err } = await supabase.from('entries').delete().eq('id', entry.id)
    setBusy(false)
    setConfirming(false)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  const title = entry.kind === 'transfer' ? `Transfer to ${toAccountName}` : categoryName
  const sign = entry.kind === 'income' ? '+' : entry.kind === 'expense' ? '−' : ''
  const items = entry.entry_items || []

  return (
    <li>
      <span className={`avatar avatar-${entry.kind}`}><Icon name={KIND_ICON[entry.kind]} /></span>
      <div className="grow">
        <div className="title">
          {title} <span className="badge">{KIND_LABEL[entry.kind]}</span>{' '}
          {entry.status === 'estimated' && <span className="badge badge-warning">Estimated</span>}
        </div>
        <div className="muted">{formatDate(entry.entry_date)} · {accountName}{entry.note ? ` · ${entry.note}` : ''}</div>
        {items.length > 0 && (
          <details>
            <summary>{items.length} item{items.length === 1 ? '' : 's'}</summary>
            <ul className="list">
              {items.map((i) => <li key={i.id}><span>{i.name}</span><span className="money">{formatINR(i.amount)}</span></li>)}
            </ul>
          </details>
        )}
        <Notice kind="error">{error}</Notice>
      </div>
      <div className={`money${entry.kind === 'income' ? ' money-in' : ''}`} aria-label={`${KIND_LABEL[entry.kind]} ${formatINR(entry.amount)}`}>
        {sign}<MoneyText value={entry.amount} />
      </div>
      <div className="row-actions">
        <Button size="small" onClick={() => onEdit(entry)}>Edit</Button>
        <Button size="small" variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
      </div>
      <ConfirmModal
        open={confirming}
        title="Delete this entry?"
        message={`${title}, ${formatINR(entry.amount)} on ${formatDate(entry.entry_date)}. This changes your balances and cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </li>
  )
}
