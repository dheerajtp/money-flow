import { Link } from 'react-router-dom'
import MoneyText from './MoneyText.jsx'

// The dark headline card.
export default function BalanceHeroCard({ net, accountCount }) {
  return (
    <section className="card card-dark" aria-labelledby="hero-title">
      <h2 id="hero-title" className="dark-label">Net worth</h2>
      <p className="dark-amount"><MoneyText value={net} /></p>
      <div className="dark-foot">
        <Link to="/accounts">View more</Link>
        <span>{accountCount} account{accountCount === 1 ? '' : 's'}</span>
      </div>
    </section>
  )
}
