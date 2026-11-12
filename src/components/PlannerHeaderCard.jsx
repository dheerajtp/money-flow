import Card from './Card.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { formatDate } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'

// The headline number. Whole rupees are rounded down so it never overstates what is safe to spend.
export default function PlannerHeaderCard({ planner }) {
  const { display, period, daysLeft, balance, committed, committedItems, cardDue, floor, usingFloor } = planner
  return (
    <Card className="planner-header">
      {period.salaryLate && <Notice kind="warning">Salary late. The plan runs to {formatDate(period.end)} until it arrives.</Notice>}
      <p className="muted">Safe to spend until {formatDate(period.end)}</p>
      <p className="kpi-value planner-amount"><MoneyText value={display.safe} whole /></p>
      {usingFloor && <p><span className="badge badge-warning">Using your floor</span> Nothing is free to spend right now.</p>}
      <p>
        <strong><MoneyText value={display.perDay} whole /></strong> a day · <strong><MoneyText value={display.perWeek} whole /></strong> a week · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
      </p>
      <details className="planner-breakdown">
        <summary>How this is worked out</summary>
        <ul className="list">
          <li><span className="grow">Balance in your spending account</span><MoneyText value={balance} /></li>
          <li><span className="grow">Bills still due before payday ({committedItems.length})</span><span>− {formatINR(committed)}</span></li>
          {committedItems.map((i) => (
            <li key={`${i.item_id}-${i.due_date}`}><span className="grow muted">{i.name} · {formatDate(i.due_date)}</span><span className="muted">{formatINR(i.amount)}</span></li>
          ))}
          <li><span className="grow">Card bill due before payday</span><span>− {formatINR(cardDue)}</span></li>
          <li><span className="grow">Minimum balance you keep</span><span>− {formatINR(floor)}</span></li>
        </ul>
      </details>
    </Card>
  )
}
