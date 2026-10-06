import EntryRow from './EntryRow.jsx'

export default function EntryList({ entries, accountsById, categoriesById, onEdit, onChanged }) {
  return (
    <ul className="list">
      {entries.map((e) => (
        <EntryRow
          key={e.id}
          entry={e}
          accountName={accountsById.get(e.account_id)?.name || 'Unknown account'}
          toAccountName={accountsById.get(e.to_account_id)?.name || 'Unknown account'}
          categoryName={categoriesById.get(e.category_id)?.name || 'Uncategorised'}
          onEdit={onEdit}
          onChanged={onChanged}
        />
      ))}
    </ul>
  )
}
