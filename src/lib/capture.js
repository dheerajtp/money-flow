import { merchantLabel } from './merchant.js'
import { buildDrafts, hashText, maskLongDigits, parseMessage, splitMessages } from './parser/index.js'

// The single account whose last 4 digits match (active accounts only), or null.
export function matchAccount(accounts, last4) {
  if (!last4) return null
  const found = accounts.filter((a) => !a.archived_at && a.last4 === last4)
  return found.length === 1 ? found[0] : null
}

export function isComplete(d) {
  if (!d.account_id || !(Number(d.amount) > 0) || !d.entry_date) return false
  if (d.kind === 'transfer') return Boolean(d.to_account_id) && d.to_account_id !== d.account_id
  return Boolean(d.category_id)
}

// Parses pasted text and saves each transaction as a DRAFT (drafts never change balances).
// db is the Supabase client. Returns a summary for the screen.
export async function createDrafts({ text, accounts, categories, rules, today, db }) {
  const messages = splitMessages(text)
  const parsed = messages.map((m) => parseMessage(m, { today }))
  const { drafts, skipped, unreadable, mandates } = buildDrafts(parsed)
  const summary = { messages: messages.length, created: 0, duplicates: 0, mandatesSaved: 0, skipped, unreadable, errors: [] }

  for (const d of drafts) {
    const rule = d.merchantKey ? rules.find((r) => r.merchant_key === d.merchantKey) : null
    let row
    if (d.kind === 'transfer') {
      const from = matchAccount(accounts, d.fromLast4)
      const to = matchAccount(accounts, d.toLast4)
        || (rule?.transfer_to_account_id ? accounts.find((a) => a.id === rule.transfer_to_account_id && !a.archived_at) : null)
      row = { kind: 'transfer', account_id: from?.id ?? null, to_account_id: to?.id ?? null, category_id: null }
    } else {
      const account = matchAccount(accounts, d.last4)
      const category = rule?.category_id
        ? categories.find((c) => c.id === rule.category_id && c.kind === d.kind && !c.archived_at)
        : null
      row = { kind: d.kind, account_id: account?.id ?? null, to_account_id: null, category_id: category?.id ?? null }
    }
    const original = d.raws.join('\n\n')
    Object.assign(row, {
      amount: d.amount,
      entry_date: d.date,
      note: d.merchant,
      merchant_key: d.merchantKey,
      status: 'draft',
      source: 'capture',
      raw_text: maskLongDigits(original),
      raw_hash: await hashText(original),
    })
    const { error } = await db.from('entries').insert(row)
    if (!error) summary.created += 1
    else if (error.code === '23505') summary.duplicates += 1
    else summary.errors.push(error.message)
  }

  for (const m of mandates) {
    const { error } = await db.from('recurring_suggestions').upsert(
      { name: merchantLabel(m.merchantKey), merchant_key: m.merchantKey, amount: m.amount, due_date: m.dueDate, source: 'mandate' },
      { onConflict: 'user_id,merchant_key,amount', ignoreDuplicates: true },
    )
    if (error) summary.errors.push(error.message)
    else summary.mandatesSaved += 1
  }
  return summary
}
