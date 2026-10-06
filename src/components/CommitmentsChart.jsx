import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatINR } from '../lib/money.js'

// rows: [{ label, subscriptions, insurance, emi, total }]
export default function CommitmentsChart({ rows }) {
  const total = rows.reduce((s, r) => s + r.total, 0)
  return (
    <div>
      <p className="chart-summary">Subscriptions, insurance and EMIs came to {formatINR(total)} in this range.</p>
      <div className="chart" role="img" aria-label="Monthly commitments: subscriptions, insurance and EMIs">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={compactINR} width={64} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <Legend />
            <Bar isAnimationActive={false} dataKey="subscriptions" name="Subscriptions" stackId="c" fill={CHART.accent} />
            <Bar isAnimationActive={false} dataKey="insurance" name="Insurance" stackId="c" fill={CHART.slate} />
            <Bar isAnimationActive={false} dataKey="emi" name="EMIs" stackId="c" fill={CHART.expense} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Monthly commitments"
        columns={[
          { key: 'label', label: 'Month' }, { key: 'subscriptions', label: 'Subscriptions', money: true },
          { key: 'insurance', label: 'Insurance', money: true }, { key: 'emi', label: 'EMIs', money: true },
          { key: 'total', label: 'Total', money: true },
        ]}
        rows={rows}
      />
    </div>
  )
}
