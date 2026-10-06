import RecurringItemRow from './RecurringItemRow.jsx'

export default function RecurringList({ items, accountsById, nextDue, amountOf, onEdit, onChanged }) {
  return (
    <ul className="list">
      {items.map((it) => (
        <RecurringItemRow
          key={it.id}
          item={it}
          amount={amountOf(it)}
          nextDue={nextDue.get(it.id)}
          payerName={accountsById.get(it.paying_account_id)?.name || 'an account'}
          onEdit={onEdit}
          onChanged={onChanged}
        />
      ))}
    </ul>
  )
}
