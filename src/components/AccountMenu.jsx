import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'
import useDismiss from '../hooks/useDismiss.js'

// Avatar button in the top bar that opens a small account menu.
export default function AccountMenu({ name, email, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)
  return (
    <div className="acct" ref={ref}>
      <button type="button" className="avatar-btn" aria-expanded={open} aria-controls="account-menu" aria-label={`Account menu for ${name || email}`} onClick={() => setOpen((o) => !o)}>
        <Avatar name={name} email={email} />
      </button>
      {open && (
        <div className="acct-pop" id="account-menu">
          <div className="acct-head">
            <Avatar name={name} email={email} />
            <span><strong>{name || email}</strong><span>{email}</span></span>
          </div>
          <Link className="nav-item" to="/profile" onClick={close}><Icon name="user" /><span className="nav-text">Your profile</span></Link>
          <button type="button" className="nav-item" onClick={() => { close(); onLogout() }}><Icon name="logout" /><span className="nav-text">Log out</span></button>
        </div>
      )}
    </div>
  )
}
