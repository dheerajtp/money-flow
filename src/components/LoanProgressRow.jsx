import MoneyText from './MoneyText.jsx'
import { formatINR } from '../lib/money.js'
import { formatMonth } from '../lib/dates.js'

export default function LoanProgressRow({ loan }) {
  return (
    <li>
      <div className="grow">
        <div className="title">{loan.name}</div>
        <div className="muted">
          {formatINR(loan.emi)} a month · {loan.monthsLeft} EMI{loan.monthsLeft === 1 ? '' : 's'} left · last one in {formatMonth(loan.lastEmi)}
        </div>
      </div>
      <MoneyText value={loan.totalLeft} owed />
    </li>
  )
}
