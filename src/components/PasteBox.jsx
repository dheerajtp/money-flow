import { useState } from 'react'
import Button from './Button.jsx'
import TextField from './TextField.jsx'

export default function PasteBox({ onRead, busy, initialText = '' }) {
  const [text, setText] = useState(initialText)
  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    await onRead(text)
    setText('')
  }
  return (
    <form className="stack" onSubmit={submit}>
      <TextField
        label="Paste bank emails or SMS" multiline rows={7} value={text} onChange={(e) => setText(e.target.value)}
        hint="Paste one message, or several with a blank line between them. Nothing leaves your device while reading them."
      />
      <div className="row-actions">
        <Button type="submit" variant="primary" busy={busy} disabled={!text.trim()}>Read messages</Button>
        <Button onClick={() => setText('')} disabled={!text}>Clear</Button>
      </div>
    </form>
  )
}
