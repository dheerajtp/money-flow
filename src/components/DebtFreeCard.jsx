import Card from './Card.jsx'
import LoanProgressRow from './LoanProgressRow.jsx'
import MoneyText from './MoneyText.jsx'
import Notice from './Notice.jsx'
import { formatMonth } from '../lib/dates.js'

export default function DebtFreeCard({ debt }) {
  return (
    <Card title="Debt-free">
      <div className="stack">
        {debt.debtFree ? (
          <Notice kind="success">You have no debts.</Notice>
        ) : (
          <>
            <p>Total you owe today: <strong><MoneyText value={debt.totalDebt} owed /></strong></p>
            {debt.debtFreeDate ? (
              <Notice kind="info">At this pace you are debt-free after your last EMI in <strong>{formatMonth(debt.debtFreeDate)}</strong>.</Notice>
            ) : (
              <Notice kind="warning">
                {debt.loansClearBy ? `Your loans clear by ${formatMonth(debt.loansClearBy)}. ` : ''}
                Credit cards still owe <MoneyText value={debt.cardsOwed} owed />. Paying them off is what makes you debt-free.
              </Notice>
            )}
          </>
        )}
        {debt.loans.length > 0 && <ul className="list">{debt.loans.map((l) => <LoanProgressRow key={l.id} loan={l} />)}</ul>}
        {debt.cards.length > 0 && (
          <ul className="list">
            {debt.cards.map((c) => (
              <li key={c.name}><span className="grow"><span className="title">{c.name}</span> <span className="muted">credit card</span></span><MoneyText value={c.owed} owed /></li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
