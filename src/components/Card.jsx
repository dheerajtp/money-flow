export default function Card({ title, actions, level = 2, children, className = '' }) {
  const Heading = `h${level}`
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-head">
          {title && <Heading>{title}</Heading>}
          {actions && <div className="row-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
