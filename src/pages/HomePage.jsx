import { useState } from 'react'
import { Link } from 'react-router-dom'
import AccountTiles from '../components/AccountTiles.jsx'
import BalanceHeroCard from '../components/BalanceHeroCard.jsx'
import Card from '../components/Card.jsx'
import CashFlowCard from '../components/CashFlowCard.jsx'
import GetStartedCard from '../components/GetStartedCard.jsx'
import GaugeCard from '../components/GaugeCard.jsx'
import Icon from '../components/Icon.jsx'
import Illustration from '../components/Illustration.jsx'
import KpiCard from '../components/KpiCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MonthBreakdown from '../components/MonthBreakdown.jsx'
import MoneyText from '../components/MoneyText.jsx'
import Notice from '../components/Notice.jsx'
import OverviewTabsCard from '../components/OverviewTabsCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PasteCard from '../components/PasteCard.jsx'
import PeriodSelect from '../components/PeriodSelect.jsx'
import TransactionsTable from '../components/TransactionsTable.jsx'
import UpcomingList from '../components/UpcomingList.jsx'
import useAccounts from '../hooks/useAccounts.js'
import useAsync from '../hooks/useAsync.js'
import useCategories from '../hooks/useCategories.js'
import useSession from '../hooks/useSession.js'
import { errorMessage, q } from '../lib/db.js'
import { addDays, addMonths, formatMonth, monthStart, todayISO } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'
import { onboardingSteps, readOnboardingHidden, setOnboardingHidden } from '../lib/onboarding.js'
import { deltaPercent, periodRanges, sumPeriod } from '../lib/periods.js'
import { supabase } from '../lib/supabase.js'

function greeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { session } = useSession()
  const userId = session.user.id
  const [period, setPeriod] = useState('this')
  const [onboardingHidden, setHidden] = useState(readOnboardingHidden)
  const today = todayISO()
  const ranges = periodRanges(period, today)
  const { data: accounts, error: accountsError } = useAccounts()
  const { data: categories, error: categoriesError } = useCategories()
  const { data, error } = useAsync(async () => {
    const rpc = (fn, args) => q(supabase.rpc(fn, args))
    const [cur, prev, spending, series, monthly, upcoming, drafts, profile, recent, pasted, goals] = await Promise.all([
      rpc('monthly_summary', { p_from: ranges.cur.from, p_to: ranges.cur.to }),
      rpc('monthly_summary', { p_from: ranges.prev.from, p_to: ranges.prev.to }),
      rpc('category_spending', { p_from: ranges.cur.from, p_to: ranges.cur.to }),
      rpc('net_worth_by_month', { p_from: addMonths(monthStart(today), -5), p_to: today }),
      rpc('monthly_summary', { p_from: addMonths(monthStart(today), -5), p_to: today }),
      rpc('upcoming_recurring', { p_from: today, p_to: addDays(today, 7) }),
      supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      q(supabase.from('profiles').select('display_name, date_of_birth').eq('id', userId).maybeSingle()),
      q(supabase.from('entries').select('*').neq('status', 'draft').order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(6)),
      supabase.from('entries').select('id', { count: 'exact', head: true }).eq('source', 'capture').eq('status', 'confirmed'),
      supabase.from('goals').select('id', { count: 'exact', head: true }),
    ])
    if (drafts.error) throw drafts.error
    if (pasted.error) throw pasted.error
    if (goals.error) throw goals.error
    return { cur: sumPeriod(cur), prev: sumPeriod(prev), spending, series, monthly, upcoming, drafts: drafts.count || 0, name: profile?.display_name || '', hasDob: Boolean(profile?.date_of_birth), recent, pastedCount: pasted.count || 0, goalCount: goals.count || 0 }
  }, [userId, period])

  const anyError = error || accountsError || categoriesError
  if (!accounts || !categories || !data) {
    return (
      <div className="stack">
        <PageHeader title="Dashboard" />
        {anyError ? <Notice kind="error">{errorMessage(anyError)}</Notice> : <LoadingState />}
      </div>
    )
  }

  const firstName = data.name.split(' ')[0]
  const hello = `${greeting(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`
  const active = accounts.filter((a) => !a.archived_at)
  const onboarding = onboardingSteps({
    bankCount: active.filter((a) => a.type === 'bank').length,
    accountCount: active.length,
    confirmedPastedCount: data.pastedCount,
    goalCount: data.goalCount,
    hasDob: data.hasDob,
  })
  const showOnboarding = !onboardingHidden && !onboarding.complete
  function hideOnboarding() {
    setOnboardingHidden(true)
    setHidden(true)
  }

  if (active.length === 0 && showOnboarding) {
    return (
      <div className="stack">
        <PageHeader title="Dashboard" subtitle={hello} />
        <div className="welcome-grid">
          <GetStartedCard summary={onboarding} onHide={hideOnboarding} />
          <Card className="welcome-art-card"><Illustration name="welcome" className="welcome-art" /></Card>
        </div>
      </div>
    )
  }

  if (active.length === 0) {
    return (
      <div className="stack">
        <PageHeader title="Dashboard" subtitle={hello} />
        <Card>
          <div className="welcome-card">
            <div>
              <h2>Let’s set up your money</h2>
              <ol>
                <li>Add your bank accounts, cards, loans and SIPs.</li>
                <li>Paste a bank message, or add an entry by hand.</li>
                <li>Watch your graphs, goals and freedom date take shape.</li>
              </ol>
              <div className="row-actions" style={{ marginTop: 'var(--space-4)' }}>
                <Link className="btn btn-primary" to="/accounts"><Icon name="plus" /> Add your first account</Link>
              </div>
            </div>
            <Illustration name="welcome" className="welcome-art" />
          </div>
        </Card>
      </div>
    )
  }

  const banks = active.filter((a) => a.type === 'bank')
  const cash = banks.reduce((s, a) => s + a.position, 0)
  const holds = active.filter((a) => ['bank', 'sip', 'stock'].includes(a.type)).reduce((s, a) => s + a.position, 0)
  const owes = active.filter((a) => a.type === 'credit_card' || a.type === 'loan').reduce((s, a) => s + Math.max(-a.position, 0), 0)
  const { cur, prev } = data
  const monthlyRows = data.monthly.map((r) => ({ label: formatMonth(r.month).split(' ')[0], income: Number(r.income) || 0, expenses: (Number(r.expenses) || 0) + (Number(r.emi) || 0) }))
  const accountsById = new Map(accounts.map((a) => [a.id, a]))
  const categoriesById = new Map(categories.map((c) => [c.id, c]))

  return (
    <div className="stack">
      <PageHeader title="Dashboard" subtitle={hello}>
        <PeriodSelect value={period} onChange={setPeriod} range={ranges.cur} />
        <Link className="btn btn-small" to="/ledger"><Icon name="plus" size={16} /> Add entry</Link>
        <Link className="btn btn-primary btn-small" to="/capture"><Icon name="clipboard" size={16} /> Paste message</Link>
      </PageHeader>

      {showOnboarding && <GetStartedCard summary={onboarding} onHide={hideOnboarding} />}

      {data.drafts > 0 && (
        <Notice kind="info">{data.drafts} draft{data.drafts === 1 ? '' : 's'} waiting for you. <Link to="/capture">Review them</Link></Notice>
      )}

      <div className="grid grid-3 top-row">
        <BalanceHeroCard net={holds - owes} accountCount={active.length} />
        <CashFlowCard income={cur.income} spent={cur.spent} prevIncome={prev.income} prevSpent={prev.spent} />
        <KpiCard label="Saved" icon="wallet" value={<MoneyText value={cur.saved} />} delta={deltaPercent(cur.saved, prev.saved)} previous={`vs. ${formatINR(prev.saved)} last period`} />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <OverviewTabsCard series={data.series} holds={holds} owes={owes} cash={cash} spending={data.spending} monthly={monthlyRows} />
          <TransactionsTable entries={data.recent} accountsById={accountsById} categoriesById={categoriesById} />
        </div>
        <div className="stack">
          <GaugeCard percent={cur.rate} caption={cur.rate === null ? 'Add income to see your rate' : 'of your income kept this period'} />
          <MonthBreakdown spending={data.spending} spent={cur.spent} />
          <PasteCard />
        </div>
      </div>

      <div className="bottom-row">
        <AccountTiles accounts={accounts} />
        <Card title="Due in the next 7 days"><UpcomingList payments={data.upcoming} accountsById={accountsById} /></Card>
      </div>
    </div>
  )
}
