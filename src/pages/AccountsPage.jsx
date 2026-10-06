import { useState } from 'react'
import AccountForm from '../components/AccountForm.jsx'
import AccountList from '../components/AccountList.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MoneyText from '../components/MoneyText.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import useAccounts from '../hooks/useAccounts.js'
import { ACCOUNT_TYPES, GROUPS, formFromAccount } from '../lib/accountFields.js'
import { errorMessage } from '../lib/db.js'

export default function AccountsPage() {
  const { data: accounts, error, reload } = useAccounts()
  const [editing, setEditing] = useState(null) // null, 'new' or an account
  const [showArchived, setShowArchived] = useState(false)

  function done() {
    setEditing(null)
    reload()
  }

  const active = (accounts || []).filter((a) => !a.archived_at)
  const holds = active
    .filter((a) => ['bank', 'sip', 'stock'].includes(a.type))
    .reduce((s, a) => s + a.position, 0)
  const owes = active
    .filter((a) => a.type === 'credit_card' || a.type === 'loan')
    .reduce((s, a) => s + Math.max(-a.position, 0), 0)
  const byId = new Map((accounts || []).map((a) => [a.id, a]))
  const banks = active.filter((a) => a.type === 'bank')

  return (
    <div className="stack">
      <PageHeader title="Accounts" subtitle="Everything you own and owe, in one place.">
        {!editing && <Button variant="primary" onClick={() => setEditing('new')}>Add account</Button>}
      </PageHeader>
      {error && <Notice kind="error">{errorMessage(error)}</Notice>}
      {!accounts && !error && <LoadingState />}

      {editing && (
        <Card title={editing === 'new' ? 'Add an account' : `Edit ${editing.name}`}>
          <AccountForm
            key={editing === 'new' ? 'new' : editing.id}
            editingId={editing === 'new' ? null : editing.id}
            initial={editing === 'new' ? undefined : formFromAccount(editing)}
            banks={banks}
            onSaved={done}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      {accounts && (
        <>
          <div className="grid grid-3">
            <StatCard title="You hold" note="Bank balances, SIPs and stocks"><MoneyText value={holds} /></StatCard>
            <StatCard title="You owe" note="Credit cards and loans"><MoneyText value={owes} owed /></StatCard>
            <StatCard title="Net worth"><MoneyText value={holds - owes} /></StatCard>
          </div>
          {active.length === 0 && !editing && (
            <EmptyState title="No accounts yet" art="accounts">Add your bank account, cards, loans, SIPs and insurance to see your money in one place.</EmptyState>
          )}
          {GROUPS.map((group) => {
            const items = accounts.filter((a) => ACCOUNT_TYPES[a.type].group === group && (showArchived || !a.archived_at))
            return items.length ? (
              <AccountList key={group} title={group} accounts={items} byId={byId} onEdit={setEditing} onChanged={reload} />
            ) : null
          })}
          {accounts.some((a) => a.archived_at) && (
            <div className="check">
              <input id="show-archived" type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              <label htmlFor="show-archived">Show archived accounts</label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
