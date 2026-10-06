import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import Icon from './Icon.jsx'

// A short checklist that ticks itself from the user's real data.
export default function GetStartedCard({ summary, onHide }) {
  const { steps, doneCount, total } = summary
  const percent = Math.round((doneCount / total) * 100)
  const nextId = steps.find((s) => !s.done)?.id
  return (
    <section className="card get-started" aria-labelledby="gs-title">
      <div className="card-head">
        <div>
          <h2 id="gs-title" className="card-title-sm">Get started</h2>
          <p className="muted gs-count">{doneCount} of {total} steps done</p>
        </div>
        <Button size="small" onClick={onHide}>Hide</Button>
      </div>
      <div className="progress" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div style={{ width: `${percent}%` }} />
      </div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.id} className={s.done ? 'step step-done' : s.id === nextId ? 'step step-next' : 'step'}>
            <span className="step-mark" aria-hidden="true">{s.done ? <Icon name="check" size={16} /> : i + 1}</span>
            <div className="step-text">
              <strong><span className="sr-only">{s.done ? 'Done: ' : 'To do: '}</span>{s.title}</strong>
              {!s.done && <span>{s.hint}</span>}
            </div>
            {!s.done && <Link className={`btn btn-small${s.id === nextId ? ' btn-primary' : ''}`} to={s.to}>{s.cta}</Link>}
          </li>
        ))}
      </ol>
    </section>
  )
}
