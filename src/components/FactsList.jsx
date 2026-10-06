export default function FactsList({ facts }) {
  if (facts.length === 0) return <p className="muted">Not enough data yet for facts. Add a few entries.</p>
  return (
    <ul>
      {facts.map((f) => <li key={f}>{f}</li>)}
    </ul>
  )
}
