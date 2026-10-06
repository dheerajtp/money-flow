import Icon from './Icon.jsx'
import { formatDate } from '../lib/dates.js'
import { PERIODS } from '../lib/periods.js'

// "Oct 1, 2026 – Oct 6, 2026 | This month" pill that changes every number on the dashboard.
export default function PeriodSelect({ value, onChange, range }) {
  return (
    <label className="pill-select">
      <Icon name="calendar" size={16} />
      <span className="pill-range">{formatDate(range.from)} – {formatDate(range.to)}</span>
      <select aria-label="Time period" value={value} onChange={(e) => onChange(e.target.value)}>
        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      <Icon name="chevronDown" size={14} />
    </label>
  )
}
