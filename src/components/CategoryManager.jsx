import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import SelectField from './SelectField.jsx'
import TextField from './TextField.jsx'
import { errorMessage } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

export default function CategoryManager({ categories, onChanged }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('expense')
  const [hasItems, setHasItems] = useState(false)
  const [editing, setEditing] = useState(null) // { id, name }
  const [error, setError] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a category name.')
    setError('')
    const { error: err } = await supabase.from('categories').insert({ name: name.trim(), kind, has_items: kind === 'expense' && hasItems })
    if (err) return setError(err.code === '23505' ? 'You already have a category with that name.' : errorMessage(err))
    setName('')
    setHasItems(false)
    onChanged()
  }

  async function update(id, patch) {
    setError('')
    const { error: err } = await supabase.from('categories').update(patch).eq('id', id)
    if (err) return setError(err.code === '23505' ? 'You already have a category with that name.' : errorMessage(err))
    setEditing(null)
    onChanged()
  }

  return (
    <div className="stack">
      <Notice kind="error">{error}</Notice>
      <form className="row" onSubmit={add} noValidate>
        <TextField label="New category" value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </SelectField>
        {kind === 'expense' && (
          <div className="check">
            <input id="cat-items" type="checkbox" checked={hasItems} onChange={(e) => setHasItems(e.target.checked)} />
            <label htmlFor="cat-items">Allow item lines (like groceries)</label>
          </div>
        )}
        <div style={{ alignSelf: 'flex-end' }}><Button type="submit" variant="primary">Add category</Button></div>
      </form>
      <ul className="list">
        {categories.map((c) => (
          <li key={c.id}>
            <div className="grow">
              {editing?.id === c.id ? (
                <TextField label={`Rename ${c.name}`} value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} />
              ) : (
                <span className="title">{c.name}</span>
              )}{' '}
              <span className="badge">{c.kind === 'income' ? 'Income' : 'Expense'}</span>
              {c.has_items && <> <span className="badge badge-info">Items</span></>}
              {c.commitment_type && <> <span className="badge badge-info">{c.commitment_type === 'subscription' ? 'Subscriptions' : 'Insurance'}</span></>}
              {c.archived_at && <> <span className="badge">Archived</span></>}
            </div>
            <div className="row-actions">
              {editing?.id === c.id ? (
                <>
                  <Button size="small" variant="primary" onClick={() => editing.name.trim() ? update(c.id, { name: editing.name.trim() }) : setError('Enter a name.')}>Save</Button>
                  <Button size="small" onClick={() => setEditing(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="small" onClick={() => setEditing({ id: c.id, name: c.name })}>Rename</Button>
                  <Button size="small" onClick={() => update(c.id, { archived_at: c.archived_at ? null : new Date().toISOString() })}>
                    {c.archived_at ? 'Restore' : 'Archive'}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
