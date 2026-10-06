import accounts from '../assets/illustrations/accounts.svg'
import calm from '../assets/illustrations/calm.svg'
import chart from '../assets/illustrations/chart.svg'
import entries from '../assets/illustrations/entries.svg'
import goals from '../assets/illustrations/goals.svg'
import paste from '../assets/illustrations/paste.svg'
import welcome from '../assets/illustrations/welcome.svg'

const ART = { accounts, calm, chart, entries, goals, paste, welcome }

// Decorative flat illustration (it adds no information, so it is hidden from screen readers).
export default function Illustration({ name, className = '' }) {
  return <img className={`art ${className}`.trim()} src={ART[name] || welcome} alt="" loading="lazy" decoding="async" />
}
