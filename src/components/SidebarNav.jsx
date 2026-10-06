import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'
import UserMenu from './UserMenu.jsx'
import { NAV_GROUPS } from '../lib/nav.js'

function readClosed() {
  try {
    return JSON.parse(localStorage.getItem('nav-closed') || '[]')
  } catch {
    return []
  }
}

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

export default function SidebarNav({ name, email, collapsed, onToggle, onLogout, draftCount }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState(readClosed)

  // Press "/" anywhere to jump to the search box.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !isTyping(e.target) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const groups = NAV_GROUPS.map((g) => ({ ...g, links: q ? g.links.filter((l) => l.label.toLowerCase().includes(q)) : g.links })).filter((g) => g.links.length)

  function toggleGroup(label) {
    setClosed((c) => {
      const next = c.includes(label) ? c.filter((x) => x !== label) : [...c, label]
      try { localStorage.setItem('nav-closed', JSON.stringify(next)) } catch { /* private mode */ }
      return next
    })
  }

  function onSearchKey(e) {
    if (e.key === 'Enter' && groups[0]) {
      navigate(groups[0].links[0].to)
      setQuery('')
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setQuery('')
      e.currentTarget.blur()
    }
  }

  return (
    <aside className="sidebar">
      <div className="side-panel">
        <div className="side-head">
          <span className="side-brand"><Logo /><span className="side-brand-text">Money flow</span></span>
          <button type="button" className="icon-btn side-toggle" onClick={onToggle} aria-pressed={collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon name="sidebar" size={18} />
          </button>
        </div>

        <label className="side-search">
          <Icon name="search" size={16} />
          <span className="sr-only">Search pages</span>
          <input ref={inputRef} type="search" placeholder="Search pages" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey} />
          <kbd className="kbd" aria-hidden="true">/</kbd>
        </label>

        <nav aria-label="Main" className="sidebar-nav">
          {groups.length === 0 && <p className="muted nav-empty">No page matches “{query}”.</p>}
          {groups.map((g, i) => {
            const isClosed = Boolean(g.label) && closed.includes(g.label) && !q
            return (
              <div key={g.label || i} className="nav-group">
                {g.label && (
                  <button type="button" className="nav-label nav-label-btn" aria-expanded={!isClosed} onClick={() => toggleGroup(g.label)}>
                    <span>{g.label}</span>
                    <span className={isClosed ? 'chev chev-closed' : 'chev'}><Icon name="chevronDown" size={14} /></span>
                  </button>
                )}
                {(!isClosed || collapsed) && g.links.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav-item" data-tip={l.label} aria-label={l.to === '/capture' && draftCount > 0 ? `${l.label}, ${draftCount} drafts waiting` : l.label}>
                    <Icon name={l.icon} />
                    <span className="nav-text">{l.label}</span>
                    {l.to === '/capture' && draftCount > 0 && (
                      <span className="nav-badge" aria-hidden="true"><span className="nav-badge-text">{draftCount}</span></span>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="side-promo">
            <span className="avatar"><Icon name="flag" /></span>
            <p><strong>See your freedom date</strong><span>Debt-free and retire-by-55, worked out from your real numbers.</span></p>
            <Link className="btn btn-primary btn-small" to="/freedom">Open <Icon name="arrowRight" size={16} /></Link>
          </div>
          <UserMenu name={name} email={email} onLogout={onLogout} />
        </div>
      </div>
    </aside>
  )
}
