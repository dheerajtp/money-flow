import { Link } from 'react-router-dom'
import EmptyState from './EmptyState.jsx'
import MoneyText from './MoneyText.jsx'
import { formatINR } from '../lib/money.js'

// Where this month's spending went: the three biggest categories and everything else.
export default function MonthBreakdown({ spending, spent }) {
  const rows = spending.map((s) => ({ name: s.name, total: Number(s.total) })).filter((s) => s.total > 0)
  const top = rows.slice(0, 3)
  const rest = rows.slice(3).reduce((s, r) => s + r.total, 0)
  const parts = rest > 0 ? [...top, { name: 'Everything else', total: rest }] : top
  const sum = parts.reduce((s, p) => s + p.total, 0)
  const pct = (p) => Math.round((p.total / sum) * 100)
  return (
    <section className="panel" aria-labelledby="mb-title">
      <div className="card-head">
        <h2 id="mb-title">Where it went</h2>
        <Link className="link-small" to="/insights">All graphs</Link>
      </div>
      {parts.length === 0 ? (
        <EmptyState title="No spending in this period" art="chart" compact />
      ) : (
        <>
          <p className="stat stat-lg"><MoneyText value={spent} /></p>
          <p className="stat-note">Spent in this period, including loan EMIs</p>
          <div className="seg-bar" role="img" aria-label={parts.map((p) => `${p.name} ${pct(p)} percent`).join(', ')}>
            {parts.map((p, i) => <span key={p.name} className={`seg seg-${i + 1}`} style={{ flexGrow: p.total }} />)}
          </div>
          <ul className="seg-legend">
            {parts.map((p, i) => (
              <li key={p.name}>
                <span className={`seg-swatch seg-${i + 1}`} />
                <span className="seg-name">{p.name}</span>
                <span className="seg-amount">{formatINR(p.total)}</span>
                <span className="seg-pct">{pct(p)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
