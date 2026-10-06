import AccountCard from './AccountCard.jsx'

export default function AccountList({ title, accounts, byId, onEdit, onChanged }) {
  return (
    <section className="card" aria-label={title}>
      <div className="card-head"><h2>{title}</h2></div>
      <ul className="list">
        {accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            bankName={a.linked_account_id ? byId.get(a.linked_account_id)?.name : null}
            onEdit={onEdit}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </section>
  )
}
