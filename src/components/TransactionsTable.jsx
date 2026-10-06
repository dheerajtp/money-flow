import { Link } from 'react-router-dom'
import EmptyState from './EmptyState.jsx'
import Icon from './Icon.jsx'
import { formatDate } from '../lib/dates.js'
import { formatINR } from '../lib/money.js'

const ICON = { income: 'arrowDown', expense: 'arrowUp', transfer: 'swap' }
const LABEL = { income: 'Income', expense: 'Expense', transfer: 'Transfer' }

export default function TransactionsTable({ entries, accountsById, categoriesById }) {
  return (
    <section className="card" aria-labelledby="rt-title">
      <div className="card-head">
        <h2 id="rt-title" className="card-title-sm">Recent transactions</h2>
        <Link className="link-small" to="/ledger">View all</Link>
      </div>
      {entries.length === 0 ? (
        <EmptyState title="No transactions yet" art="entries" compact>Add an entry or paste a bank message.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th scope="col">Date</th><th scope="col">Transaction</th><th scope="col">Account</th><th scope="col">Type</th><th scope="col" className="num">Amount</th></tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const title = e.kind === 'transfer' ? `Transfer to ${accountsById.get(e.to_account_id)?.name || 'account'}` : categoriesById.get(e.category_id)?.name || 'Uncategorised'
                const sign = e.kind === 'income' ? '+' : e.kind === 'expense' ? '−' : ''
                return (
                  <tr key={e.id}>
                    <td className="muted-cell">{formatDate(e.entry_date)}</td>
                    <td><span className="cell-with-icon"><span className={`avatar avatar-sm avatar-${e.kind}`}><Icon name={ICON[e.kind]} size={14} /></span>{title}</span></td>
                    <td className="muted-cell">{accountsById.get(e.account_id)?.name || 'Account'}</td>
                    <td><span className={`type-pill type-${e.kind}`}>{LABEL[e.kind]}</span></td>
                    <td className={`num amount${e.kind === 'income' ? ' amount-in' : ''}`}>{sign}{formatINR(e.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
