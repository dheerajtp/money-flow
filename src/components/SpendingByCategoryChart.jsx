import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import EmptyState from './EmptyState.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatINR } from '../lib/money.js'

export default function SpendingByCategoryChart({ data }) {
  const rows = data.map((d) => ({ name: d.name, total: Number(d.total) }))
  if (rows.length === 0) return <EmptyState title="No spending in this range" />
  const total = rows.reduce((s, r) => s + r.total, 0)
  const table = rows.map((r) => ({ ...r, share: `${Math.round((r.total / total) * 100)}%` }))
  return (
    <div>
      <p className="chart-summary">
        Total spending {formatINR(total)}. Biggest: {rows[0].name} at {formatINR(rows[0].total)}.
      </p>
      <div className="chart" role="img" aria-label={`Spending by category. Biggest is ${rows[0].name}.`} style={{ height: Math.max(220, rows.length * 34 + 40) }}>
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" tickFormatter={compactINR} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <Bar isAnimationActive={false} dataKey="total" name="Spent" fill={CHART.accent} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Spending by category"
        columns={[{ key: 'name', label: 'Category' }, { key: 'total', label: 'Spent', money: true }, { key: 'share', label: 'Share' }]}
        rows={table}
      />
    </div>
  )
}
