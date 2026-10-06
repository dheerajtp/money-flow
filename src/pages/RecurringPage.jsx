import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RecurringForm from '../components/RecurringForm.jsx'
import RecurringList from '../components/RecurringList.jsx'
import RunNowButton from '../components/RunNowButton.jsx'
import SuggestionList from '../components/SuggestionList.jsx'
import UpcomingList from '../components/UpcomingList.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import { errorMessage, q } from '../lib/db.js'
import { addDays, todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

export default function RecurringPage() {
  const today = todayISO()
  const { data: accounts, error: accountsError, reload: reloadAccounts } = useAccounts()
  const { data, error, reload } = useAsync(async () => {
    const [items, suggestions, upcoming] = await Promise.all([
      q(supabase.from('recurring_items').select('*').order('created_at', { ascending: true })),
      q(supabase.from('recurring_suggestions').select('*').eq('status', 'open').order('created_at', { ascending: false })),
      q(supabase.rpc('upcoming_recurring', { p_from: todayISO(), p_to: addDays(todayISO(), 400) })),
    ])
    return { items, suggestions, upcoming }
  }, [])
  const [editing, setEditing] = useState(null) // null, 'new', an item, or { suggestion }

  function done() {
    setEditing(null)
    reload()
    reloadAccounts()
  }

  const anyError = error || accountsError
  if (!accounts || !data) {
    return (
      <div className="stack">
        <PageHeader title="Recurring payments" subtitle="Subscriptions, EMIs and premiums." />
        {anyError ? <Notice kind="error">{errorMessage(anyError)}</Notice> : <LoadingState />}
      </div>
    )
  }

  const accountsById = new Map(accounts.map((a) => [a.id, a]))
  const nextDue = new Map()
  for (const u of [...data.upcoming].sort((a, b) => a.due_date.localeCompare(b.due_date))) {
    if (!nextDue.has(u.item_id)) nextDue.set(u.item_id, u.due_date)
  }
  const amountOf = (it) => {
    if (it.kind === 'subscription') return it.amount
    const acc = accountsById.get(it.linked_account_id)
    return it.kind === 'emi' ? acc?.details?.emi_amount : acc?.details?.premium_amount
  }
  const soon = data.upcoming.filter((u) => u.due_date <= addDays(today, 30)).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const visible = data.items.filter((i) => i.status !== 'ended')
  const ended = data.items.filter((i) => i.status === 'ended')
  const hasPayers = accounts.some((a) => ['bank', 'debit_card', 'credit_card'].includes(a.type) && !a.archived_at)

  return (
    <div className="stack">
      <PageHeader title="Recurring payments" subtitle="Subscriptions, EMIs and premiums.">
        {!editing && <Button variant="primary" onClick={() => setEditing('new')} disabled={!hasPayers}>Add recurring payment</Button>}
      </PageHeader>
      <p className="muted">
        On each due date an estimated entry is added so your balance drops even before the bank message arrives.
        When you paste the real message, it replaces the estimate. Estimates are created whenever you open the app, or press Run now.
      </p>
      {anyError && <Notice kind="error">{errorMessage(anyError)}</Notice>}
      {!hasPayers && <Notice kind="info">Add a bank account or card on the Accounts page first.</Notice>}

      {editing && (
        <Card title={editing === 'new' ? 'Add a recurring payment' : editing.suggestion ? `Track ${editing.suggestion.name}` : `Edit ${editing.name}`}>
          <RecurringForm
            key={editing === 'new' ? 'new' : editing.id || editing.suggestion.id}
            item={editing === 'new' || editing.suggestion ? null : editing}
            suggestion={editing.suggestion}
            accounts={accounts}
            items={data.items}
            onSaved={done}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      {data.suggestions.length > 0 && (
        <Card title={`Suggestions (${data.suggestions.length})`}>
          <SuggestionList suggestions={data.suggestions} onAccept={(s) => setEditing({ suggestion: s })} onChanged={reload} />
        </Card>
      )}

      <Card title="Coming up in the next 30 days"><UpcomingList payments={soon} accountsById={accountsById} /></Card>

      <Card title="Your recurring payments">
        {visible.length === 0
          ? <EmptyState title="Nothing tracked yet" art="calm">Add subscriptions, loan EMIs and insurance premiums, or paste bank messages and accept the suggestions.</EmptyState>
          : <RecurringList items={visible} accountsById={accountsById} nextDue={nextDue} amountOf={amountOf} onEdit={setEditing} onChanged={reload} />}
        {ended.length > 0 && (
          <details>
            <summary>Ended ({ended.length})</summary>
            <RecurringList items={ended} accountsById={accountsById} nextDue={nextDue} amountOf={amountOf} onEdit={setEditing} onChanged={reload} />
          </details>
        )}
      </Card>

      <Card title="Refresh estimates"><RunNowButton onDone={reload} /></Card>
    </div>
  )
}
