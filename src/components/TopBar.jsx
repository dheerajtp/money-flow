import { Link } from 'react-router-dom'
import AccountMenu from './AccountMenu.jsx'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'

// Phone header. On desktop the sidebar carries search, profile and log out.
export default function TopBar({ name, email, draftCount, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Logo />
      </div>
      <div className="topbar-right">
        <Link className="icon-btn" to="/capture" aria-label={draftCount > 0 ? `${draftCount} drafts waiting` : 'No drafts waiting'}>
          <Icon name="bell" size={18} />
          {draftCount > 0 && <span className="dot-badge" aria-hidden="true" />}
        </Link>
        <AccountMenu name={name} email={email} onLogout={onLogout} />
      </div>
    </header>
  )
}
