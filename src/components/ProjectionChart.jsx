import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatMonth } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'

export default function ProjectionChart({ series }) {
  const rows = series.map((p) => ({ label: formatMonth(p.date), projected: p.projected, target: p.target }))
  const last = rows[rows.length - 1]
  return (
    <div>
      <p className="chart-summary">
        By {last.label} your savings are projected at {formatINR(last.projected)} against a freedom number of {formatINR(last.target)}.
      </p>
      <div className="chart" role="img" aria-label="Projected savings against the freedom number over time">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" minTickGap={24} />
            <YAxis tickFormatter={compactINR} width={64} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <Legend />
            <Line isAnimationActive={false} type="monotone" dataKey="projected" name="Projected savings" stroke={CHART.accent} strokeWidth={3} dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey="target" name="Freedom number" stroke={CHART.danger} strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Projected savings and freedom number over time"
        columns={[{ key: 'label', label: 'Month' }, { key: 'projected', label: 'Projected savings', money: true }, { key: 'target', label: 'Freedom number', money: true }]}
        rows={rows}
      />
    </div>
  )
}
