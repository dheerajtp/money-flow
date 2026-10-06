import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AmountChangePrompt from '../components/AmountChangePrompt.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import DraftList from '../components/DraftList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PasteBox from '../components/PasteBox.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import useCategories from '../hooks/useCategories.js'
import { createDrafts } from '../lib/capture.js'
import { errorMessage, q } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

export default function CapturePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: accounts, error: accountsError } = useAccounts()
  const { data: categories, error: categoriesError } = useCategories()
  const { data: rules, reload: reloadRules } = useAsync(() => q(supabase.from('merchant_rules').select('*')), [])
  const { data: drafts, error, reload } = useAsync(
    () => q(supabase.from('entries').select('*').eq('status', 'draft').order('created_at', { ascending: false })),
    [],
  )
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState(null)
  const [readError, setReadError] = useState('')
  const [prompts, setPrompts] = useState([])

  const ready = accounts && categories && rules && drafts
  const active = (accounts || []).filter((a) => !a.archived_at)

  async function onRead(text) {
    setBusy(true)
    setReadError('')
    try {
      setSummary(await createDrafts({ text, accounts, categories, rules, today: todayISO(), db: supabase }))
      reload()
    } catch (err) {
      setReadError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function confirmed(results) {
    setPrompts((p) => [...p, ...results.map((r) => r?.amount_change).filter(Boolean)])
    reload()
    reloadRules()
  }

  const anyError = error || accountsError || categoriesError

  return (
    <div className="stack">
      <PageHeader title="Paste messages" subtitle="Turn bank emails and SMS into entries. Drafts change nothing until you confirm them." />
      <HowItWorks />
      {anyError && <Notice kind="error">{errorMessage(anyError)}</Notice>}
      {!ready && !anyError && <LoadingState />}

      {ready && active.length === 0 && (
        <Notice kind="info">Add your accounts first (with the last 4 digits of cards and accounts) so messages can be matched. <Link to="/accounts">Go to Accounts</Link></Notice>
      )}

      {ready && (
        <Card title="Paste">
          <Notice kind="error">{readError}</Notice>
          <PasteBox onRead={onRead} busy={busy} initialText={location.state?.text || ''} />
        </Card>
      )}

      {summary && (
        <Card title="What was found">
          <div className="stack">
            <Notice kind={summary.created ? 'success' : 'info'}>
              {summary.messages} message{summary.messages === 1 ? '' : 's'} read: {summary.created} draft{summary.created === 1 ? '' : 's'} added
              {summary.duplicates ? `, ${summary.duplicates} already pasted before` : ''}
              {summary.skipped.length ? `, ${summary.skipped.length} skipped` : ''}
              {summary.unreadable.length ? `, ${summary.unreadable.length} could not be read` : ''}.
            </Notice>
            {summary.mandatesSaved > 0 && (
              <Notice kind="info">
                {summary.mandatesSaved} upcoming auto-payment{summary.mandatesSaved === 1 ? '' : 's'} saved as a suggestion. <Link to="/recurring">Review on Recurring</Link>
              </Notice>
            )}
            {summary.errors.map((m, i) => <Notice key={i} kind="error">{m}</Notice>)}
            {summary.skipped.length > 0 && (
              <ul className="list">
                {summary.skipped.map((s, i) => (
                  <li key={i}><span className="grow">Skipped: {s.reason}</span></li>
                ))}
              </ul>
            )}
            {summary.unreadable.map((u, i) => (
              <div key={i} className="card">
                <p><strong>Could not read this message</strong></p>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{u.raw.replace(/\d{9,}/g, '[masked]')}</pre>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button size="small" onClick={() => navigate('/ledger', { state: { prefill: { note: u.raw.replace(/\d{9,}/g, '[masked]').replace(/\s+/g, ' ').slice(0, 200) } } })}>
                    Add it as an entry by hand
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {ready && (
        <Card title={`Drafts to review (${drafts.length})`}>
          {drafts.length === 0 ? (
            <EmptyState title="No drafts waiting" art="paste">Paste a message above to create one.</EmptyState>
          ) : (
            <DraftList drafts={drafts} accounts={active} categories={categories} onChanged={reload} onConfirmed={confirmed} />
          )}
        </Card>
      )}

      {prompts.length > 0 && <AmountChangePrompt key={prompts[0].item_id} change={prompts[0]} onDone={() => setPrompts((p) => p.slice(1))} />}
    </div>
  )
}
