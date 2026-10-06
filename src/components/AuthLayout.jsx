import Icon from './Icon.jsx'
import Illustration from './Illustration.jsx'
import Logo from './Logo.jsx'

const POINTS = [
  { icon: 'clipboard', title: 'Paste, don’t type', text: 'Bank emails and SMS become entries you confirm.' },
  { icon: 'flag', title: 'Plan your freedom', text: 'Emergency fund, goals and a retire-by-55 estimate.' },
  { icon: 'shield', title: 'Private by design', text: 'Every account sees only its own data.' },
]

export default function AuthLayout({ title, lead, children, footer }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <Logo to="/login" />
        <p className="auth-tagline">Know where every rupee goes.</p>
        <div className="pitch">
          <span className="eyebrow"><Icon name="sparkle" size={14} /> Personal money tracker</span>
          <h2>Know where every rupee goes.</h2>
          <p className="lead">Your accounts, cards and loans in one place, and a clear view of how close you are to financial freedom.</p>
          <Illustration name="welcome" className="auth-art" />
          <ul className="points">
            {POINTS.map((p) => (
              <li key={p.title}>
                <span className="avatar"><Icon name={p.icon} /></span>
                <div><strong>{p.title}</strong><span>{p.text}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          <div className="stack">{children}</div>
          {footer && <p className="auth-foot">{footer}</p>}
        </div>
        <p className="auth-trust"><Icon name="shield" size={16} /> Your data stays private to you.</p>
      </main>
    </div>
  )
}
