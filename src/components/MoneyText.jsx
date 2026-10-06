import { formatINR, formatINRWhole } from '../lib/money.js'

// owed: show as an amount owed (red, with the word "owed" for screen readers).
// The ₹ sign is drawn smaller and raised, like a currency prefix.
export default function MoneyText({ value, owed = false, whole = false }) {
  const text = whole ? formatINRWhole(value) : formatINR(value)
  const m = text.match(/^(-?)(₹)(.*)$/)
  return (
    <span className={`money${owed && Number(value) > 0 ? ' money-owed' : ''}`}>
      {m ? <>{m[1]}<span className="cur">{m[2]}</span>{m[3]}</> : text}
      {owed && <span className="sr-only"> owed</span>}
    </span>
  )
}
