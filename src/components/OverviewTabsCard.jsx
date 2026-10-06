import { useState } from 'react'
import IncomeExpenseChart from './IncomeExpenseChart.jsx'
import NetWorthChartCard from './NetWorthChartCard.jsx'
import SpendingByCategoryChart from './SpendingByCategoryChart.jsx'
import Tabs from './Tabs.jsx'

const TABS = [
  { id: 'worth', label: 'Net worth' },
  { id: 'spend', label: 'Spending by category' },
  { id: 'flow', label: 'Income and spending' },
]

// A white card with tabs inside it.
export default function OverviewTabsCard({ series, holds, owes, cash, spending, monthly }) {
  const [tab, setTab] = useState('worth')
  return (
    <section className="card" aria-label="Overview charts">
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Overview charts" idPrefix="ov" />
      <hr className="tabs-divider" />
      <div role="tabpanel" id={`ov-panel-${tab}`} aria-labelledby={`ov-tab-${tab}`}>
        {tab === 'worth' && <NetWorthChartCard bare series={series} holds={holds} owes={owes} cash={cash} />}
        {tab === 'spend' && <SpendingByCategoryChart data={spending} />}
        {tab === 'flow' && <IncomeExpenseChart rows={monthly} />}
      </div>
    </section>
  )
}
