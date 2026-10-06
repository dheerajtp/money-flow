import MoneyText from './MoneyText.jsx'
import { deltaPercent } from '../lib/periods.js'

// Money in and money out for the chosen period, drawn as two bars sharing one scale.
export default function CashFlowCard({ income, spent, prevIncome, prevSpent }) {
  const top = Math.max(income, spent, 1)
  return (
    <section className="card" aria-labelledby="flow-title">
      <h2 id="flow-title" className="card-title-sm">Cash flow</h2>
      <div className="flow">
        <h3 className="flow-label">Money in</h3>
        <p className="flow-amount"><MoneyText value={income} /></p>
        {deltaPercent(income, prevIncome) !== null && <span className="flow-change">{deltaPercent(income, prevIncome) >= 0 ? '+' : '−'}{Math.abs(deltaPercent(income, prevIncome))}% vs last period</span>}
        <div className="flow-bar" aria-hidden="true"><span className="flow-in" style={{ width: `${(income / top) * 100}%` }} /></div>
      </div>
      <div className="flow">
        <h3 className="flow-label">Money out</h3>
        <p className="flow-amount"><MoneyText value={spent} /></p>
        {deltaPercent(spent, prevSpent) !== null && <span className="flow-change">{deltaPercent(spent, prevSpent) >= 0 ? '+' : '−'}{Math.abs(deltaPercent(spent, prevSpent))}% vs last period</span>}
        <div className="flow-bar" aria-hidden="true"><span className="flow-out" style={{ width: `${(spent / top) * 100}%` }} /></div>
      </div>
    </section>
  )
}
