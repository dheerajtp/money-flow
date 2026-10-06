import { Link } from 'react-router-dom'

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Home">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        <circle cx="17" cy="17" r="17" fill="#1a1a1a" />
        <rect x="9.5" y="9.5" width="15" height="15" rx="5" fill="none" stroke="#ffffff" strokeWidth="3" />
      </svg>
    </Link>
  )
}
