// Round avatar with the person's initials.
export default function Avatar({ name, email }) {
  const source = (name || email || '?').trim()
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const initials = ((parts[0]?.[0] || '?') + (name && parts[1] ? parts[1][0] : '')).toUpperCase()
  return <span className="avatar-initials" aria-hidden="true">{initials}</span>
}
