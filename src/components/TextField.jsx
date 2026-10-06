import { useId } from 'react'

export default function TextField({ label, error, hint, multiline = false, endSlot = null, ...rest }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {endSlot ? (
        <div className="input-wrap">
          <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
          {endSlot}
        </div>
      ) : (
        <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      )}
      {hint && <span id={hintId} className="field-hint">{hint}</span>}
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </div>
  )
}
