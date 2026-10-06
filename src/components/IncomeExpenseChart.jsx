import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTable from './ChartTable.jsx'
import { CHART, compactINR } from '../lib/chartColors.js'
import { formatINR } from '../lib/money.js'

// rows: [{ label, income, expenses }] (expenses include loan EMIs)
export default function IncomeExpenseChart({ rows }) {
  const income = rows.reduce((s, r) => s + r.income, 0)
  const spent = rows.reduce((s, r) => s + r.expenses, 0)
  return (
    <div>
      <p className="chart-summary">Income {formatINR(income)}, expenses {formatINR(spent)} in this range.</p>
      <div className="chart" role="img" aria-label="Income against expenses for each month">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 8, right: 16 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={compactINR} width={64} />
            <Tooltip formatter={(v) => formatINR(v)} />
            <Legend />
            <Bar isAnimationActive={false} dataKey="income" name="Income" fill={CHART.income} />
            <Bar isAnimationActive={false} dataKey="expenses" name="Expenses" fill={CHART.expense} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartTable
        caption="Income and expenses by month"
        columns={[{ key: 'label', label: 'Month' }, { key: 'income', label: 'Income', money: true }, { key: 'expenses', label: 'Expenses', money: true }]}
        rows={rows}
      />
    </div>
  )
}
