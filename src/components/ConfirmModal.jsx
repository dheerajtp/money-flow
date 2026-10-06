import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button.jsx'

// Confirmation dialog rendered in a portal. Escape cancels; Tab stays inside.
export default function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, busy = false, onConfirm, onCancel,
}) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    cancelRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        onCancelRef.current?.()
      } else if (e.key === 'Tab' && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll('button:not(:disabled)')
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="modal-backdrop">
      <div ref={dialogRef} className="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-message">
        <h2 id="modal-title">{title}</h2>
        <p id="modal-message">{message}</p>
        <div className="row-actions">
          <Button ref={cancelRef} onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} busy={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
