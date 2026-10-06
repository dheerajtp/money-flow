import { useCallback, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import useDismiss from '../hooks/useDismiss.js'
import { MORE_LINKS, TAB_LINKS } from '../lib/nav.js'

// Phone navigation: four main tabs plus a "More" menu.
export default function TabBar({ onLogout }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const wrapRef = useRef(null)
  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.to))

  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, wrapRef)

  return (
    <div ref={wrapRef}>
      <nav className="tabbar" aria-label="Main">
        {TAB_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className="tab">
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
        <button type="button" className="tab" data-active={moreActive} aria-expanded={open} aria-controls="more-menu" onClick={() => setOpen((o) => !o)}>
          <Icon name="more" />
          More
        </button>
      </nav>
      {open && (
        <div className="more-menu" id="more-menu">
          {MORE_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-item" onClick={() => setOpen(false)}>
              <Icon name={l.icon} />
              {l.label}
            </NavLink>
          ))}
          <hr />
          <button type="button" className="nav-item" onClick={() => { setOpen(false); onLogout() }}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
