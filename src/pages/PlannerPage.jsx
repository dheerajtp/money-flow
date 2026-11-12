import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PlannerHeaderCard from '../components/PlannerHeaderCard.jsx'
import PlannerSetupForm from '../components/PlannerSetupForm.jsx'
import useCategories from '../hooks/useCategories.js'
import usePlanner from '../hooks/usePlanner.js'
import { errorMessage } from '../lib/db.js'

export default function PlannerPage() {
  const { loading, error, settings, accounts, planner, reload } = usePlanner()
  const { data: categories, error: categoriesError } = useCategories()
  const [editing, setEditing] = useState(false)

  if (loading || !categories) {
    const err = error || categoriesError
    return (
      <div className="stack">
        <PageHeader title="Planner" />
        {err ? <Notice kind="error">{errorMessage(err)}</Notice> : <LoadingState />}
      </div>
    )
  }

  const hasBank = accounts.some((a) => a.type === 'bank' && !a.archived_at)
  const showForm = editing || (!planner && hasBank)
  const saved = () => { setEditing(false); reload() }

  return (
    <div className="stack">
      <PageHeader title="Planner" subtitle="How much you can safely spend until your next salary.">
        {planner && !editing && <Button size="small" onClick={() => setEditing(true)} aria-label="Planner settings"><Icon name="settings" size={16} /> Settings</Button>}
      </PageHeader>
      {error && <Notice kind="error">{errorMessage(error)}</Notice>}
      {!hasBank && (
        <EmptyState title="Add a bank account first" icon="bank">
          The Planner works from the bank account your salary lands in. <Link to="/accounts">Add an account</Link>
        </EmptyState>
      )}
      {showForm && <PlannerSetupForm settings={settings} accounts={accounts} categories={categories} onSaved={saved} onCancel={planner ? () => setEditing(false) : null} />}
      {planner && <PlannerHeaderCard planner={planner} />}
    </div>
  )
}
