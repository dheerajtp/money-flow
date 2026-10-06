import EmptyState from './EmptyState.jsx'
import MoneyText from './MoneyText.jsx'
import { formatDate } from '../lib/dates.js'

export default function UpcomingList({ payments, accountsById }) {
  if (payments.length === 0) return <EmptyState title="Nothing coming up" art="calm" compact>No recurring payments are due in this time.</EmptyState>
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)
  return (
    <div>
      <ul className="list">
        {payments.map((p) => (
          <li key={`${p.item_id}-${p.due_date}`}>
            <span className="grow">
              <span className="title">{p.name}</span>
              <span className="muted"> · {formatDate(p.due_date)} · from {accountsById.get(p.paying_account_id)?.name || 'an account'}</span>
            </span>
            <MoneyText value={p.amount} />
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 'var(--space-3)' }}><strong>Total: <MoneyText value={total} /></strong></p>
    </div>
  )
}
