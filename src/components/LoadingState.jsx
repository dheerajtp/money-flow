export default function LoadingState({ label = 'Loading' }) {
  return (
    <div aria-busy="true" aria-live="polite" className="stack">
      <span className="sr-only">{label}…</span>
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  )
}
