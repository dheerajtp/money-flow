import { useState } from 'react'
import BucketItem from './BucketItem.jsx'
import BucketItemForm from './BucketItemForm.jsx'
import Button from './Button.jsx'
import Card from './Card.jsx'
import EmptyState from './EmptyState.jsx'
import Notice from './Notice.jsx'
import { errorMessage } from '../lib/db.js'
import { formatINR } from '../lib/money.js'
import { supabase } from '../lib/supabase.js'

export default function BucketList({ items, history, projection, onChanged }) {
  const [editing, setEditing] = useState(null) // null, 'new' or an item
  const [error, setError] = useState('')
  const byId = new Map(projection.items.map((p) => [p.id, p]))
  const nextPriority = items.reduce((m, i) => Math.max(m, i.priority), -1) + 1

  async function move(index, dir) {
    const order = [...items]
    const target = index + dir
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    setError('')
    const changed = order.map((g, i) => ({ g, i })).filter(({ g, i }) => g.priority !== i)
    const results = await Promise.all(changed.map(({ g, i }) => supabase.from('goals').update({ priority: i }).eq('id', g.id)))
    const failed = results.find((r) => r.error)
    if (failed) setError(errorMessage(failed.error))
    onChanged()
  }

  function done() {
    setEditing(null)
    onChanged()
  }

  return (
    <Card title="Bucket list" actions={!editing ? <Button variant="primary" size="small" onClick={() => setEditing('new')}>Add an item</Button> : null}>
      <div className="stack">
        <Notice kind="error">{error}</Notice>
        {editing && (
          <BucketItemForm
            key={editing === 'new' ? 'new' : editing.id}
            item={editing === 'new' ? null : editing}
            nextPriority={nextPriority}
            onSaved={done}
            onCancel={() => setEditing(null)}
          />
        )}
        {items.length === 0 && !editing && (
          <EmptyState title="Nothing on your bucket list yet" art="goals">Add the things you want to buy, in the order you want them.</EmptyState>
        )}
        {items.length > 0 && (
          <>
            <p className="muted">Items are funded one after another, from the top. Use Up and Down to change the order.</p>
            <ul className="list">
              {items.map((item, index) => (
                <BucketItem
                  key={item.id}
                  item={item}
                  projected={byId.get(item.id)}
                  noSavings={projection.noSavings}
                  index={index}
                  count={items.length}
                  onMove={(dir) => move(index, dir)}
                  onEdit={setEditing}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          </>
        )}
        {history.length > 0 && (
          <details>
            <summary>Bought or archived ({history.length})</summary>
            <ul className="list">
              {history.map((h) => (
                <li key={h.id}>
                  <span className="grow">{h.name} <span className="badge">{h.status === 'bought' ? 'Bought' : 'Archived'}</span></span>
                  <span className="money">{formatINR(h.target_amount)}</span>
                  <Button size="small" onClick={async () => { await supabase.from('goals').update({ status: 'active', priority: nextPriority }).eq('id', h.id); onChanged() }}>Move back to list</Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  )
}
