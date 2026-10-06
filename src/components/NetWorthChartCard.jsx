import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import Icon from './Icon.jsx'
import MoneyText from './MoneyText.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatMonth } from '../lib/dates.js'
import { formatINR, formatINRWhole } from '../lib/money.js'

// Net worth over the last months, with what you hold, what you owe and cash below.
export default function NetWorthChartCard({ series, holds, owes, cash, bare = false }) {
  const rows = series.map((r) => ({ label: formatMonth(r.month).split(' ')[0], full: formatMonth(r.month), net: Number(r.net), owed: Number(r.liabilities) }))
  const last = rows[rows.length - 1]
  const before = rows.length > 1 ? rows[rows.length - 2] : null
  const change = before ? last.net - before.net : null
  return (
    <div className={bare ? 'nw-bare' : undefined}>
      <div className="nw-top">
        <div>
          <p className="kpi-value kpi-value-lg"><MoneyText value={holds - owes} /></p>
          {change !== null && (
            <p className="kpi-foot">
              <span className={`delta ${change >= 0 ? 'delta-good' : 'delta-bad'}`}><Icon name={change >= 0 ? 'arrowUp' : 'arrowDown'} size={12} />{formatINRWhole(Math.abs(change))}</span>
              <span>since last month</span>
            </p>
          )}
        </div>
        <ul className="legend-inline" aria-hidden="true">
          <li><span className="dot" style={{ background: CHART.accent }} />Net worth</li>
          <li><span className="dot dot-dash" />Owed</li>
        </ul>
      </div>
      <div className="chart chart-area" role="img" aria-label={`Net worth over the last months. Now ${formatINR(holds - owes)}.`}>
        <ResponsiveContainer>
          <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cfcfcf" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f8f7f7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ececec" strokeDasharray="3 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#6b6b6b', fontSize: 12 }} />
            <YAxis tickFormatter={compactINR} tickLine={false} axisLine={false} width={56} tick={{ fill: '#6b6b6b', fontSize: 12 }} />
            <Tooltip formatter={(v) => formatINR(v)} labelFormatter={(_, p) => p?.[0]?.payload?.full} />
            <Area isAnimationActive={false} type="monotone" dataKey="owed" name="Owed" stroke="#9b9b9b" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />
            <Area isAnimationActive={false} type="monotone" dataKey="net" name="Net worth" stroke={CHART.accent} strokeWidth={2.5} fill="url(#nwFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mini-grid">
        <div className="mini" style={{ '--mini': '#1a1a1a' }}><Icon name="wallet" size={16} /><p>You hold</p><strong>{formatINRWhole(holds)}</strong></div>
        <div className="mini" style={{ '--mini': '#b91c1c' }}><Icon name="loan" size={16} /><p>You owe</p><strong>{formatINRWhole(owes)}</strong></div>
        <div className="mini" style={{ '--mini': '#cfcfcf' }}><Icon name="bank" size={16} /><p>Cash in banks</p><strong>{formatINRWhole(cash)}</strong></div>
      </div>
      <ChartTable caption="Net worth by month" columns={[{ key: 'full', label: 'Month' }, { key: 'net', label: 'Net worth', money: true }, { key: 'owed', label: 'Owed', money: true }]} rows={rows} />
    </div>
  )
}
