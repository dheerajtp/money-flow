import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatINR } from '../lib/money.js'

// rows: [{ label, savings }]
export default function SavingsTrendChart({ rows }) {
  const total = rows.reduce((s, r) => s + r.savings, 0)
  return (
    <div>
      <p className="chart-summary">Saved {formatINR(total)} over this range.</p>
      <div className="chart" role="img" aria-label="Savings for each month">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={compactINR} width={64} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <ReferenceLine y={0} stroke={CHART.grey} />
            <Line isAnimationActive={false} type="monotone" dataKey="savings" name="Saved" stroke={CHART.accent} strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Savings by month"
        columns={[{ key: 'label', label: 'Month' }, { key: 'savings', label: 'Saved', money: true }]}
        rows={rows}
      />
    </div>
  )
}
