import { useRef } from 'react'

// Segmented control. mode "tabs" switches a panel (arrow keys move between tabs);
// mode "toggle" is a group of filter buttons.
export default function Tabs({ tabs, value, onChange, label, idPrefix = 'tabs', mode = 'tabs' }) {
  const refs = useRef([])

  function onKeyDown(e, i) {
    const last = tabs.length - 1
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next === null) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  if (mode === 'toggle') {
    return (
      <div role="group" aria-label={label} className="tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" className="tab-btn" aria-pressed={value === t.id} onClick={() => onChange(t.id)}>{t.label}</button>
        ))}
      </div>
    )
  }
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {tabs.map((t, i) => (
        <button
          key={t.id} ref={(el) => { refs.current[i] = el }} type="button" role="tab" className="tab-btn"
          id={`${idPrefix}-tab-${t.id}`} aria-selected={value === t.id} aria-controls={`${idPrefix}-panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1} onClick={() => onChange(t.id)} onKeyDown={(e) => onKeyDown(e, i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
