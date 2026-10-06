import { useState } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import ValueUpdateForm from './ValueUpdateForm.jsx'
import { ACCOUNT_TYPES } from '../lib/accountFields.js'
import { errorMessage } from '../lib/db.js'
import { formatDate, formatMonth, todayISO } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'
import { lastEmiDate, monthsLeft } from '../lib/loans.js'
import { supabase } from '../lib/supabase.js'

function summary(account, bankName) {
  const d = account.details || {}
  const today = todayISO()
  switch (account.type) {
    case 'bank':
      return { label: 'Balance', value: <MoneyText value={account.position} /> }
    case 'credit_card': {
      const owed = Math.max(-account.position, 0)
      return {
        label: 'Owed',
        value: <MoneyText value={owed} owed />,
        detail: `Limit ${formatINR(d.credit_limit)}, available ${formatINR(Number(d.credit_limit) - owed)}. Statement day ${d.statement_day}, due day ${d.due_day}.`,
      }
    }
    case 'loan': {
      const left = monthsLeft(d, today)
      return {
        label: left === 0 ? 'Completed' : 'Still to pay',
        value: left === 0 ? null : <MoneyText value={-account.position} owed />,
        detail: left === 0
          ? `All ${formatINR(d.emi_amount)} EMIs paid.`
          : `${formatINR(d.emi_amount)} EMI on day ${d.emi_day}. ${left} left, last in ${formatMonth(lastEmiDate(d))}.`,
      }
    }
    case 'sip':
      return { label: 'Value', value: <MoneyText value={account.position} />, detail: `${formatINR(d.monthly_amount)} on day ${d.sip_day} of each month.` }
    case 'stock':
      return { label: 'Value', value: <MoneyText value={account.position} />, detail: 'Update the value whenever you like.' }
    case 'debit_card':
      return { label: 'Spends from', value: bankName || 'a bank account' }
    case 'insurance':
      return { label: 'Premium', value: <MoneyText value={d.premium_amount} />, detail: `${d.frequency}, next due ${formatDate(d.next_due_date)}.` }
    default:
      return { label: '', value: null }
  }
}

export default function AccountCard({ account, bankName, onEdit, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const info = summary(account, bankName)
  const archived = Boolean(account.archived_at)

  async function setArchived(value) {
    setError('')
    const { error: err } = await supabase.from('accounts').update({ archived_at: value ? new Date().toISOString() : null }).eq('id', account.id)
    if (err) setError(errorMessage(err))
    else onChanged()
  }

  async function remove() {
    setBusy(true)
    setError('')
    const { error: err } = await supabase.from('accounts').delete().eq('id', account.id)
    setBusy(false)
    setConfirming(false)
    if (err) {
      setError(err.code === '23503'
        ? 'This account has entries or recurring payments, so it cannot be deleted. Archive it instead.'
        : errorMessage(err))
    } else onChanged()
  }

  return (
    <li>
      <span className={`avatar${ACCOUNT_TYPES[account.type].liability ? ' avatar-owe' : ''}`}><Icon name={ACCOUNT_TYPES[account.type].icon} /></span>
      <div className="grow">
        <div className="title">
          {account.name} {archived && <span className="badge">Archived</span>}
        </div>
        <div className="muted">
          {ACCOUNT_TYPES[account.type].label}
          {account.institution ? ` · ${account.institution}` : ''}
          {account.last4 ? ` · ending ${account.last4}` : ''}
        </div>
        {info.detail && <div className="muted">{info.detail}</div>}
        <Notice kind="error">{error}</Notice>
        {updating && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <ValueUpdateForm account={account} onSaved={() => { setUpdating(false); onChanged() }} onCancel={() => setUpdating(false)} />
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="muted">{info.label}</div>
        <div>{info.value}</div>
      </div>
      <div className="row-actions">
        {(account.type === 'sip' || account.type === 'stock') && !updating && !archived && (
          <Button size="small" onClick={() => setUpdating(true)}>Update value</Button>
        )}
        <Button size="small" onClick={() => onEdit(account)}>Edit</Button>
        <Button size="small" onClick={() => setArchived(!archived)}>{archived ? 'Restore' : 'Archive'}</Button>
        <Button size="small" variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
      </div>
      <ConfirmModal
        open={confirming}
        title={`Delete ${account.name}?`}
        message="This cannot be undone. An account that has entries cannot be deleted; archive it instead."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </li>
  )
}
