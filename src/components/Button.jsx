export default function Button({ variant = 'secondary', size, busy = false, disabled, type = 'button', className = '', children, ...rest }) {
  const cls = ['btn', variant !== 'secondary' && `btn-${variant}`, size === 'small' && 'btn-small', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={cls} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? 'Please wait…' : children}
    </button>
  )
}
