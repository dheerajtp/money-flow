import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'
import useDismiss from '../hooks/useDismiss.js'

// Profile card at the bottom of the sidebar, with a small menu.
export default function UserMenu({ name, email, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)
  return (
    <div className="user-wrap" ref={ref}>
      {open && (
        <div className="user-pop" id="user-menu">
          <Link className="nav-item" to="/profile" onClick={close}><Icon name="user" /><span className="nav-text">Your profile</span></Link>
          <button type="button" className="nav-item" onClick={() => { close(); onLogout() }}><Icon name="logout" /><span className="nav-text">Log out</span></button>
        </div>
      )}
      <button type="button" className="user-btn" aria-expanded={open} aria-controls="user-menu" aria-label={`Account menu for ${name || email}`} onClick={() => setOpen((o) => !o)}>
        <Avatar name={name} email={email} />
        <span className="user-meta">
          <strong>{name || email}</strong>
          <span>{email}</span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
    </div>
  )
}
