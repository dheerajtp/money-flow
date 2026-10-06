import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import EmptyState from '../components/EmptyState.jsx'
import EntryFilters from '../components/EntryFilters.jsx'
import EntryForm from '../components/EntryForm.jsx'
import EntryList from '../components/EntryList.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import useCategories from '../hooks/useCategories.js'
import { errorMessage, q } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

const PAGE = 25
const NO_FILTERS = { from: '', to: '', account: '', category: '', kind: '' }

export default function LedgerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const prefill = location.state?.prefill
  const { data: accounts, error: accountsError, reload: reloadAccounts } = useAccounts()
  const { data: categories, error: categoriesError, reload: reloadCategories } = useCategories()
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pages, setPages] = useState(1)
  const [editing, setEditing] = useState(prefill ? { prefill } : null) // null, 'new', an entry, or { prefill }

  const key = JSON.stringify(filters)
  const { data, error, reload } = useAsync(async () => {
    let query = supabase
      .from('entries')
      .select('*, entry_items(id, name, amount)')
      .neq('status', 'draft')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, pages * PAGE)
    if (filters.from) query = query.gte('entry_date', filters.from)
    if (filters.to) query = query.lte('entry_date', filters.to)
    if (filters.account) query = query.or(`account_id.eq.${filters.account},to_account_id.eq.${filters.account}`)
    if (filters.category) query = query.eq('category_id', filters.category)
    if (filters.kind) query = query.eq('kind', filters.kind)
    return q(query)
  }, [key, pages])

  function changeFilters(next) {
    setFilters(next)
    setPages(1)
  }

  function saved() {
    setEditing(null)
    if (prefill) navigate('/ledger', { replace: true, state: null })
    reload()
    reloadAccounts()
  }

  const loadingBase = !accounts || !categories
  const activeAccounts = (accounts || []).filter((a) => !a.archived_at)
  const accountsById = new Map((accounts || []).map((a) => [a.id, a]))
  const categoriesById = new Map((categories || []).map((c) => [c.id, c]))
  const rows = data ? data.slice(0, pages * PAGE) : []
  const hasMore = data ? data.length > pages * PAGE : false
  const anyError = error || accountsError || categoriesError

  return (
    <div className="stack">
      <PageHeader title="Entries" subtitle="Income, spending and transfers.">
        {!editing && !loadingBase && <Button variant="primary" onClick={() => setEditing('new')}>Add entry</Button>}
      </PageHeader>
      {anyError && <Notice kind="error">{errorMessage(anyError)}</Notice>}
      {loadingBase && !anyError && <LoadingState />}

      {editing && !loadingBase && (
        <Card title={editing.id ? 'Edit entry' : 'Add an entry'}>
          {activeAccounts.length === 0 ? (
            <Notice kind="info">Add an account first, then you can record entries.</Notice>
          ) : (
            <EntryForm
              key={editing.id || 'new'}
              accounts={activeAccounts}
              categories={categories}
              initial={editing === 'new' ? undefined : editing.prefill ? { note: editing.prefill.note } : editing}
              onSaved={saved}
              onCancel={() => { setEditing(null); if (prefill) navigate('/ledger', { replace: true, state: null }) }}
            />
          )}
        </Card>
      )}

      {!loadingBase && (
        <Card title="Your entries">
          <EntryFilters filters={filters} onChange={changeFilters} accounts={accounts} categories={categories} />
          <div style={{ marginTop: 'var(--space-3)' }}>
            {!data && !error && <LoadingState />}
            {data && rows.length === 0 && (
              <EmptyState title="No entries yet" art="entries">
                {key === JSON.stringify(NO_FILTERS) ? 'Add an entry, or paste a bank message on the Paste page.' : 'Nothing matches these filters.'}
              </EmptyState>
            )}
            {rows.length > 0 && (
              <EntryList entries={rows} accountsById={accountsById} categoriesById={categoriesById} onEdit={setEditing} onChanged={() => { reload(); reloadAccounts() }} />
            )}
            {hasMore && <div style={{ marginTop: 'var(--space-3)' }}><Button onClick={() => setPages((p) => p + 1)}>Show more</Button></div>}
          </div>
        </Card>
      )}

      {!loadingBase && (
        <Card title="Categories">
          <details>
            <summary>Add, rename or archive categories</summary>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <CategoryManager categories={categories} onChanged={reloadCategories} />
            </div>
          </details>
        </Card>
      )}
    </div>
  )
}
