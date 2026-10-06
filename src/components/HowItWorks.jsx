const STEPS = [
  { title: 'Paste', text: 'Paste bank emails or SMS, one or many at a time.' },
  { title: 'Check', text: 'The amount, date and payee are read and matched to your accounts.' },
  { title: 'Confirm', text: 'Fix anything, then confirm. Drafts change nothing until you do.' },
]

// The whole Paste workflow in three lines.
export default function HowItWorks() {
  return (
    <section className="card how" aria-labelledby="how-title">
      <h2 id="how-title" className="sr-only">How it works</h2>
      <ol className="how-steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="step-mark" aria-hidden="true">{i + 1}</span>
            <div className="step-text"><strong>{s.title}</strong><span>{s.text}</span></div>
          </li>
        ))}
      </ol>
    </section>
  )
}
