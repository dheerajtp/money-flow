import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from './Card.jsx'
import Icon from './Icon.jsx'

// Type or paste a bank message here and carry on in the Paste page.
export default function PasteCard() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  function submit(e) {
    e.preventDefault()
    navigate('/capture', { state: { text } })
  }
  return (
    <Card title="Paste a bank message">
      <div className="paste-card">
        <span className="orb" aria-hidden="true" />
        <p className="muted">Paste an SMS or email and it becomes a draft you can confirm.</p>
        <form className="paste-input" onSubmit={submit}>
          <label className="sr-only" htmlFor="quick-paste">Bank message</label>
          <input id="quick-paste" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a message…" autoComplete="off" />
          <button type="submit" className="send-btn" aria-label="Continue to the Paste page"><Icon name="arrowUp" size={16} /></button>
        </form>
      </div>
    </Card>
  )
}
