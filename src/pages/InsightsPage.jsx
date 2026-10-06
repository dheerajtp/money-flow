import { useState } from 'react'
import Card from '../components/Card.jsx'
import CommitmentsChart from '../components/CommitmentsChart.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FactsList from '../components/FactsList.jsx'
import IncomeExpenseChart from '../components/IncomeExpenseChart.jsx'
import LoadingState from '../components/LoadingState.jsx'
import NetWorthChart from '../components/NetWorthChart.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RangeSelector from '../components/RangeSelector.jsx'
import SavingsTrendChart from '../components/SavingsTrendChart.jsx'
import SpendingByCategoryChart from '../components/SpendingByCategoryChart.jsx'
import useAsync from '../hooks/useAsync.js'
import { errorMessage, q } from '../lib/db.js'
import { addMonths, formatMonth, monthEnd, monthStart, todayISO } from '../lib/dates.js'
import { buildFacts } from '../lib/facts.js'
import { rangeFor } from '../lib/ranges.js'
import { supabase } from '../lib/supabase.js'

const n = (v) => Number(v) || 0

export default function InsightsPage() {
  const [rangeKey, setRangeKey] = useState('last3')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const today = todayISO()
  const range = rangeFor(rangeKey, today, custom)

  const { data, error } = useAsync(async () => {
    if (range.error) return null
    const thisStart = monthStart(today)
    const prevStart = addMonths(thisStart, -1)
    const three = rangeFor('last3', today)
    const rpc = (fn, args) => q(supabase.rpc(fn, args))
    const [rows, spending, netWorth, lastThree, thisMonth, lastMonth] = await Promise.all([
      rpc('monthly_summary', { p_from: range.from, p_to: range.to }),
      rpc('category_spending', { p_from: range.from, p_to: range.to }),
      rpc('net_worth_by_month', { p_from: range.from, p_to: range.to }),
      rpc('monthly_summary', { p_from: three.from, p_to: three.to }),
      rpc('category_spending', { p_from: thisStart, p_to: today }),
      rpc('category_spending', { p_from: prevStart, p_to: monthEnd(prevStart) }),
    ])
    return { rows, spending, netWorth, lastThree, thisMonth, lastMonth }
  }, [range.from, range.to, range.error])

  const monthly = (data?.rows || []).map((r) => {
    const expenses = n(r.expenses) + n(r.emi)
    return {
      label: formatMonth(r.month), income: n(r.income), expenses, savings: n(r.income) - expenses,
      subscriptions: n(r.subscriptions), insurance: n(r.insurance), emi: n(r.emi),
      total: n(r.subscriptions) + n(r.insurance) + n(r.emi),
    }
  })
  const netRows = (data?.netWorth || []).map((r) => ({
    label: formatMonth(r.month), assets: n(r.assets), liabilities: n(r.liabilities), net: n(r.net),
  }))
  const empty = data && monthly.every((m) => m.income === 0 && m.expenses === 0 && m.total === 0) && data.spending.length === 0
  const facts = data
    ? buildFacts({
        rangeRows: data.rows,
        lastThreeRows: data.lastThree,
        spending: data.spending,
        thisMonthSpending: data.thisMonth,
        lastMonthSpending: data.lastMonth,
      })
    : []

  return (
    <div className="stack">
      <PageHeader title="Graphs" subtitle="See where your money goes." />
      <Card>
        <RangeSelector rangeKey={rangeKey} onKeyChange={setRangeKey} custom={custom} onCustomChange={setCustom} error={range.error && rangeKey === 'custom' && custom.from && custom.to ? range.error : undefined} />
      </Card>
      {error && <Notice kind="error">{errorMessage(error)}</Notice>}
      {!data && !error && !range.error && <LoadingState />}
      {range.error && <Notice kind="info">{range.error}</Notice>}
      {empty && <EmptyState title="No data in this range" art="chart">Add entries or paste bank messages, or choose another range.</EmptyState>}
      {data && !empty && (
        <>
          <Card title="Facts"><FactsList facts={facts} /></Card>
          <div className="grid grid-2">
            <Card title="Spending by category"><SpendingByCategoryChart data={data.spending} /></Card>
            <Card title="Income and expenses"><IncomeExpenseChart rows={monthly} /></Card>
            <Card title="Savings per month"><SavingsTrendChart rows={monthly} /></Card>
            <Card title="Net worth"><NetWorthChart rows={netRows} /></Card>
          </div>
          <Card title="Monthly commitments"><CommitmentsChart rows={monthly} /></Card>
          <p className="muted">Expenses include loan EMI payments. Transfers between your own accounts, card bill payments and SIP instalments are not counted as spending.</p>
        </>
      )}
    </div>
  )
}
