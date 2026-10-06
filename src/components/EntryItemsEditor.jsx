import Button from './Button.jsx'
import Notice from './Notice.jsx'
import TextField from './TextField.jsx'
import { formatINR, parseAmount } from '../lib/money.js'

// Optional item lines for a grocery-type expense. Items are never required.
export default function EntryItemsEditor({ items, onChange, amount, error }) {
  const total = items.reduce((s, i) => s + (parseAmount(i.amount) || 0), 0)
  const update = (index, key, value) => onChange(items.map((it, i) => (i === index ? { ...it, [key]: value } : it)))

  return (
    <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend><strong>Items (optional)</strong></legend>
      <Notice kind="error">{error}</Notice>
      {items.map((item, index) => (
        <div className="row" key={index}>
          <TextField label={`Item ${index + 1} name`} value={item.name} onChange={(e) => update(index, 'name', e.target.value)} />
          <TextField label={`Item ${index + 1} amount (₹)`} inputMode="decimal" value={item.amount} onChange={(e) => update(index, 'amount', e.target.value)} />
          <div style={{ alignSelf: 'flex-end' }}><Button size="small" onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove item {index + 1}</Button></div>
        </div>
      ))}
      <div className="row-actions">
        <Button size="small" onClick={() => onChange([...items, { name: '', amount: '' }])}>Add item</Button>
        {items.length > 0 && (
          <span className="muted" role="status">
            Items total {formatINR(total)}{amount ? ` of ${formatINR(amount)}` : ''}
          </span>
        )}
      </div>
    </fieldset>
  )
}
