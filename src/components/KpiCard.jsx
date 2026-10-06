import Icon from './Icon.jsx'

// A small headline number with its change since the previous period.
export default function KpiCard({ label, icon, value, delta, goodWhenUp = true, previous }) {
  const up = delta !== null && delta >= 0
  const good = delta === null ? null : goodWhenUp ? up : !up
  return (
    <section className="card kpi" aria-label={label}>
      <div className="kpi-head">
        <h3>{label}</h3>
        <Icon name={icon} size={18} />
      </div>
      <p className="kpi-value">{value}</p>
      <p className="kpi-foot">
        {delta !== null && (
          <span className={`delta ${good ? 'delta-good' : 'delta-bad'}`}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} />
            {Math.abs(delta)}%
          </span>
        )}
        <span>{previous}</span>
      </p>
    </section>
  )
}
