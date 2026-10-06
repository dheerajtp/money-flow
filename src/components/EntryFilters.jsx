import SelectField from './SelectField.jsx'
import Tabs from './Tabs.jsx'
import TextField from './TextField.jsx'

export default function EntryFilters({ filters, onChange, accounts, categories }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })
  return (
    <div className="row" role="group" aria-label="Filter entries">
      <TextField label="From date" type="date" value={filters.from} onChange={set('from')} />
      <TextField label="To date" type="date" value={filters.to} onChange={set('to')} />
      <SelectField label="Account" value={filters.account} onChange={set('account')}>
        <option value="">All accounts</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </SelectField>
      <SelectField label="Category" value={filters.category} onChange={set('category')}>
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </SelectField>
      <div className="kind-filter">
        <Tabs
          mode="toggle" label="Kind of entry" value={filters.kind}
          onChange={(kind) => onChange({ ...filters, kind })}
          tabs={[{ id: '', label: 'All' }, { id: 'expense', label: 'Expenses' }, { id: 'income', label: 'Income' }, { id: 'transfer', label: 'Transfers' }]}
        />
      </div>
    </div>
  )
}
