import Card from './Card.jsx'

const TICKS = 40

// A half-circle of ticks showing how much of your income you kept.
export default function GaugeCard({ percent, caption }) {
  const shown = percent === null ? 0 : Math.max(0, Math.min(100, percent))
  const filled = Math.round((shown / 100) * TICKS)
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle = Math.PI - (i / (TICKS - 1)) * Math.PI
    const [x1, y1] = [100 + 62 * Math.cos(angle), 100 - 62 * Math.sin(angle)]
    const [x2, y2] = [100 + 82 * Math.cos(angle), 100 - 82 * Math.sin(angle)]
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="3" strokeLinecap="round" stroke={i < filled ? '#1a1a1a' : '#e8e7e7'} />
  })
  return (
    <Card title="Savings rate">
      <div className="gauge">
        <svg viewBox="0 0 200 112" role="img" aria-label={percent === null ? 'No income yet, so no savings rate' : `You saved ${percent} percent of your income`}>
          {ticks}
        </svg>
        <p className="gauge-value">{percent === null ? '—' : `${percent}%`}</p>
        <p className="gauge-caption">{caption}</p>
      </div>
    </Card>
  )
}
