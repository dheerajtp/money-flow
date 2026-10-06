import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatINR } from '../lib/money.js'

// rows: [{ label, assets, liabilities, net }]
export default function NetWorthChart({ rows }) {
  const last = rows[rows.length - 1]
  return (
    <div>
      <p className="chart-summary">
        Net worth at the end of {last.label}: {formatINR(last.net)} ({formatINR(last.assets)} held, {formatINR(last.liabilities)} owed).
      </p>
      <div className="chart" role="img" aria-label="Net worth at the end of each month">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={compactINR} width={64} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <Legend />
            <Line isAnimationActive={false} type="monotone" dataKey="net" name="Net worth" stroke={CHART.accent} strokeWidth={3} dot />
            <Line isAnimationActive={false} type="monotone" dataKey="assets" name="Held" stroke={CHART.income} strokeWidth={2} strokeDasharray="6 3" dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey="liabilities" name="Owed" stroke={CHART.danger} strokeWidth={2} strokeDasharray="2 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Net worth by month"
        columns={[
          { key: 'label', label: 'Month end' }, { key: 'assets', label: 'Held', money: true },
          { key: 'liabilities', label: 'Owed', money: true }, { key: 'net', label: 'Net worth', money: true },
        ]}
        rows={rows}
      />
    </div>
  )
}
