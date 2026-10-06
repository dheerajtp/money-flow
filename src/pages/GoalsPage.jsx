import BucketList from '../components/BucketList.jsx'
import EmergencyFundCard from '../components/EmergencyFundCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import useMonthlyAverages from '../hooks/useMonthlyAverages.js'
import { errorMessage, q } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'
import { emergencyTarget, projectGoals } from '../lib/projection.js'
import { supabase } from '../lib/supabase.js'

export default function GoalsPage() {
  const { data: accounts, error: accountsError } = useAccounts()
  const { data: avg, error: avgError } = useMonthlyAverages()
  const { data: goals, error, reload } = useAsync(
    () => q(supabase.from('goals').select('*').order('priority', { ascending: true })),
    [],
  )
  const anyError = error || accountsError || avgError

  if (!accounts || !goals || !avg) {
    return (
      <div className="stack">
        <PageHeader title="Goals" subtitle="Build your safety net and save for what you want." />
        {anyError ? <Notice kind="error">{errorMessage(anyError)}</Notice> : <LoadingState />}
      </div>
    )
  }

  const emergency = goals.find((g) => g.kind === 'emergency')
  const banks = accounts.filter((a) => a.type === 'bank' && !a.archived_at)
  const balance = emergency?.account_id ? accounts.find((a) => a.id === emergency.account_id)?.position ?? 0 : 0
  const averages = avg.averages
  const target = emergencyTarget(emergency?.target_amount, averages?.spending ?? 0)
  const shortfall = target.amount ? Math.max(target.amount - balance, 0) : 0
  const active = goals.filter((g) => g.kind === 'bucket' && g.status === 'active').sort((a, b) => a.priority - b.priority)
  const history = goals.filter((g) => g.kind === 'bucket' && g.status !== 'active')
  const projection = projectGoals({
    monthlySavings: averages?.savings ?? 0,
    emergencyShortfall: shortfall,
    emergencyFirst: emergency?.emergency_first ?? true,
    today: todayISO(),
    items: active.map((g) => ({ id: g.id, price: Number(g.target_amount), savedSoFar: Number(g.saved_so_far), targetDate: g.target_date })),
  })

  return (
    <div className="stack">
      <PageHeader title="Goals" subtitle="Build your safety net and save for what you want." />
      {averages ? (
        <p className="muted" role="status">
          Based on your last {averages.months} {avg.range.partial ? 'month so far' : `full month${averages.months === 1 ? '' : 's'}`}:
          you save about {formatINR(averages.savings)} a month and spend about {formatINR(averages.spending)}.
        </p>
      ) : (
        <Notice kind="info">Add some entries first. Dates and the emergency fund suggestion come from your real income and spending.</Notice>
      )}
      <EmergencyFundCard
        key={emergency?.updated_at || 'none'}
        goal={emergency}
        banks={banks}
        balance={balance}
        target={target}
        averages={averages}
        partial={avg.range?.partial}
        onChanged={reload}
      />
      {emergency?.emergency_first && projection.emergencyMonths > 0 && (
        <Notice kind="info">Your emergency fund is filled first, which takes about {projection.emergencyMonths} month{projection.emergencyMonths === 1 ? '' : 's'}.</Notice>
      )}
      <BucketList items={active} history={history} projection={projection} onChanged={reload} />
    </div>
  )
}
