import { Link } from 'react-router-dom'
import AssumptionsForm from '../components/AssumptionsForm.jsx'
import Card from '../components/Card.jsx'
import DebtFreeCard from '../components/DebtFreeCard.jsx'
import FreedomSummaryCard from '../components/FreedomSummaryCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProjectionChart from '../components/ProjectionChart.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import useMonthlyAverages from '../hooks/useMonthlyAverages.js'
import useSession from '../hooks/useSession.js'
import { errorMessage, q } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { DEFAULT_SETTINGS, debtSummary, projectionSeries, retirementProjection } from '../lib/freedom.js'
import { supabase } from '../lib/supabase.js'

export default function FreedomPage() {
  const { session } = useSession()
  const userId = session.user.id
  const { data: accounts, error: accountsError } = useAccounts()
  const { data: avg, error: avgError } = useMonthlyAverages()
  const { data: profile, error: profileError } = useAsync(() => q(supabase.from('profiles').select('*').eq('id', userId).single()), [userId])
  const { data: row, error: settingsError, reload } = useAsync(
    async () => ({ value: (await q(supabase.from('freedom_settings').select('*').eq('user_id', userId).maybeSingle())) }),
    [userId],
  )
  const anyError = accountsError || avgError || profileError || settingsError

  if (!accounts || !avg || !profile || !row) {
    return (
      <div className="stack">
        <PageHeader title="Freedom" subtitle="Your path to being debt-free and stopping work." />
        {anyError ? <Notice kind="error">{errorMessage(anyError)}</Notice> : <LoadingState />}
      </div>
    )
  }

  const today = todayISO()
  const settings = row.value
    ? { multiplier: Number(row.value.multiplier), annualReturn: Number(row.value.annual_return), inflation: Number(row.value.inflation) }
    : DEFAULT_SETTINGS
  const active = accounts.filter((a) => !a.archived_at)
  const debt = debtSummary({
    loans: active.filter((a) => a.type === 'loan'),
    cards: active.filter((a) => a.type === 'credit_card').map((a) => ({ name: a.name, owed: Math.max(-a.position, 0) })),
    today,
  })
  const averages = avg.averages
  const investedNow = active.filter((a) => a.type === 'sip' || a.type === 'stock').reduce((s, a) => s + a.position, 0)
  const input = averages && profile.date_of_birth ? {
    dob: profile.date_of_birth, retirementAge: profile.retirement_age, today, livingMonthly: averages.living,
    loans: debt.loans, investedNow, monthlyInvesting: averages.sip, settings,
  } : null
  const projection = input ? retirementProjection(input) : null

  return (
    <div className="stack">
      <PageHeader title="Freedom" subtitle="Your path to being debt-free and stopping work." />
      <DebtFreeCard debt={debt} />
      {!profile.date_of_birth && (
        <Notice kind="info">Add your date of birth on your <Link to="/profile">profile</Link> to see when you could stop working.</Notice>
      )}
      {profile.date_of_birth && !averages && (
        <Notice kind="info">Add some entries first. The freedom number comes from your real spending.</Notice>
      )}
      {projection && (
        <>
          <FreedomSummaryCard
            projection={projection} settings={settings} retirementAge={profile.retirement_age}
            investedNow={investedNow} monthlyInvesting={averages.sip} partial={avg.range.partial}
          />
          {projection.months > 0 && <Card title="Savings against the freedom number"><ProjectionChart series={projectionSeries(input)} /></Card>}
        </>
      )}
      <AssumptionsForm key={row.value?.updated_at || 'default'} settings={settings} onSaved={reload} />
    </div>
  )
}
