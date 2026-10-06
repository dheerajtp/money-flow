import { Link } from 'react-router-dom'
import EmptyState from './EmptyState.jsx'
import Icon from './Icon.jsx'
import MoneyText from './MoneyText.jsx'
import { ACCOUNT_TYPES } from '../lib/accountFields.js'

// Your accounts as a card with a tidy grid of tiles.
export default function AccountTiles({ accounts }) {
  const shown = accounts.filter((a) => !a.archived_at && ['bank', 'credit_card', 'loan', 'sip', 'stock'].includes(a.type)).slice(0, 6)
  return (
    <section className="card" aria-labelledby="at-title">
      <div className="card-head">
        <h2 id="at-title" className="card-title-sm">Your accounts</h2>
        <Link className="link-small" to="/accounts">See all</Link>
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No accounts to show" art="accounts" compact>Add a bank account, card or loan to see it here.</EmptyState>
      ) : (
        <ul className="tiles">
          {shown.map((a) => {
            const liability = ACCOUNT_TYPES[a.type].liability
            return (
              <li key={a.id} className="tile">
                <span className={`avatar${liability ? ' avatar-owe' : ''}`}><Icon name={ACCOUNT_TYPES[a.type].icon} /></span>
                <p className="tile-name">{a.name}</p>
                <p className="tile-sub">{ACCOUNT_TYPES[a.type].label}</p>
                <p className="tile-value">{liability ? <MoneyText value={Math.max(-a.position, 0)} owed whole /> : <MoneyText value={a.position} whole />}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
