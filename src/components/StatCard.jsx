export default function StatCard({ title, children, note }) {
  return (
    <section className="card">
      <p className="stat-label">{title}</p>
      <div className="stat">{children}</div>
      {note && <p className="stat-note">{note}</p>}
    </section>
  )
}
