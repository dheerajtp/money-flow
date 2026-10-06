import { useState } from 'react'
import Icon from './Icon.jsx'
import TextField from './TextField.jsx'

// A password box with a show/hide button.
export default function PasswordField({ label, ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <TextField
      label={label}
      {...rest}
      type={show ? 'text' : 'password'}
      endSlot={
        <button type="button" className="input-toggle" aria-label={`${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow((s) => !s)}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      }
    />
  )
}
