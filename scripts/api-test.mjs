// Runs the app's own query code against a real PostgREST + Postgres (see supabase/test/api.sh).
import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { buildAccountRow, emptyForm, validateAccount } from '../src/lib/accountFields.js'
import { createDrafts, isComplete } from '../src/lib/capture.js'
import { addDays, monthStart, todayISO } from '../src/lib/dates.js'
import { debtSummary } from '../src/lib/freedom.js'
import { averagingRange, monthlyAverages } from '../src/lib/monthlyAverages.js'
import * as F from '../src/lib/parser/fixtures.js'

const { API_URL, JWT_SECRET, PG_EXEC } = process.env
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
function token(sub) {
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })
  return `${head}.${body}.${createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')}`
}
function clientFor(jwt) {
  return createClient(API_URL, 'anon-key', {
    accessToken: async () => jwt,
    global: { fetch: (input, init) => fetch(String(input).replace('/rest/v1', ''), init) },
  })
}
const sql = (text) => execSync(PG_EXEC, { input: text }).toString()
const ok = async (promise, label) => {
  const { data, error } = await promise
  assert.equal(error, null, `${label}: ${error?.message}`)
  return data
}
let steps = 0
const step = (name) => { steps += 1; console.log(`  ${steps}. ${name}`) }

const A = randomUUID()
const B = randomUUID()
sql(`insert into auth.users (id, email, raw_user_meta_data) values ('${A}','a@x.com','{"display_name":"Asha"}'), ('${B}','b@x.com','{}');`)
const a = clientFor(token(A))
const b = clientFor(token(B))
const today = todayISO()

console.log('API integration test')

step('sign-up created the profile with the display name, and the default categories')
const profile = await ok(a.from('profiles').select('*').eq('id', A).single(), 'profile')
assert.equal(profile.display_name, 'Asha')
assert.equal(profile.retirement_age, 55)
const categories = await ok(a.from('categories').select('*').order('name'), 'categories')
assert.equal(categories.length, 15)
const cat = (name) => categories.find((c) => c.name === name)

step('profile can be updated; an impossible retirement age is rejected by the database')
await ok(a.from('profiles').update({ display_name: 'Asha K', date_of_birth: '1990-04-01', retirement_age: 55 }).eq('id', A), 'profile update')
const bad = await a.from('profiles').update({ retirement_age: 20 }).eq('id', A)
assert.ok(bad.error, 'retirement age 20 must fail')

step('every account type, built exactly as the form builds it, is accepted by the database')
const forms = {
  bank: { name: 'HDFC Savings', last4: '1234', opening: '1000' },
  credit_card: { name: 'HDFC Card', last4: '9876', opening: '2000', credit_limit: '100000', statement_day: '1', due_day: '20' },
  loan: { name: 'Car loan', emi_amount: '1000', emi_day: '5', first_emi_month: '2026-01', last_emi_month: '2099-12' },
  sip: { name: 'Index SIP', monthly_amount: '500', sip_day: '10' },
  stock: { name: 'Zerodha' },
  insurance: { name: 'Term plan', premium_amount: '1200', frequency: 'yearly', next_due_date: addDays(today, 40) },
}
const acc = {}
for (const [type, over] of Object.entries(forms)) {
  const form = { ...emptyForm(type), ...over }
  assert.deepEqual(validateAccount(form), {}, `${type} validates`)
  acc[type] = (await ok(a.from('accounts').insert(buildAccountRow(form)).select('*').single(), type))
}
const debitForm = { ...emptyForm('debit_card'), name: 'HDFC Debit', last4: '5555', linked_account_id: acc.bank.id }
acc.debit_card = await ok(a.from('accounts').insert(buildAccountRow(debitForm)).select('*').single(), 'debit card')

step('SIP and stock values: a second update on the same day replaces the first')
await ok(a.from('account_values').upsert({ account_id: acc.sip.id, as_of: today, value: 10000 }, { onConflict: 'account_id,as_of' }), 'value 1')
await ok(a.from('account_values').upsert({ account_id: acc.sip.id, as_of: today, value: 12000 }, { onConflict: 'account_id,as_of' }), 'value 2')
await ok(a.from('account_values').upsert({ account_id: acc.stock.id, as_of: today, value: 8000 }, { onConflict: 'account_id,as_of' }), 'stock value')
assert.equal((await ok(a.from('account_values').select('*').eq('account_id', acc.sip.id), 'values')).length, 1)

step('entries: add with grocery items, read back with items, edit, delete (as the entry form does)')
const groceries = await ok(a.from('entries').insert({ account_id: acc.bank.id, kind: 'expense', amount: 450, entry_date: today, category_id: cat('Groceries').id, note: 'Weekly shop' }).select('id').single(), 'entry')
await ok(a.from('entry_items').insert([{ entry_id: groceries.id, name: 'Milk', amount: 60 }, { entry_id: groceries.id, name: 'Rice', amount: 300 }]), 'items')
const withItems = await ok(a.from('entries').select('*, entry_items(id, name, amount)').eq('id', groceries.id).single(), 'embed')
assert.equal(withItems.entry_items.length, 2)
const tooMany = await a.from('entry_items').insert({ entry_id: groceries.id, name: 'Too much', amount: 500 })
assert.ok(tooMany.error, 'items above the amount must be rejected')
await ok(a.from('entries').update({ amount: 500, note: 'Weekly shop (edited)' }).eq('id', groceries.id), 'edit')
const salary = await ok(a.from('entries').insert({ account_id: acc.bank.id, kind: 'income', amount: 60000, entry_date: today, category_id: cat('Salary').id }).select('id').single(), 'salary')
const gone = await ok(a.from('entries').insert({ account_id: acc.bank.id, kind: 'expense', amount: 10, entry_date: today, category_id: cat('Fuel').id }).select('id').single(), 'temp')
await ok(a.from('entries').delete().eq('id', gone.id), 'delete')
await ok(a.from('entries').insert({ account_id: acc.credit_card.id, kind: 'expense', amount: 500, entry_date: today, category_id: cat('Shopping').id }), 'card spend')
await ok(a.from('entries').insert({ account_id: acc.debit_card.id, kind: 'expense', amount: 100, entry_date: today, category_id: cat('Fuel').id }), 'debit card spend')
await ok(a.from('entries').insert({ account_id: acc.bank.id, to_account_id: acc.sip.id, kind: 'transfer', amount: 2000, entry_date: today }), 'SIP transfer')

step('balances: bank, credit card owed, loan owed, SIP and stock values (account_positions)')
const positions = Object.fromEntries((await ok(a.rpc('account_positions', { p_at: today }), 'positions')).map((p) => [p.account_id, Number(p.pos)]))
assert.equal(positions[acc.bank.id], 1000 - 500 + 60000 - 100 - 2000)
assert.equal(positions[acc.credit_card.id], -2000 - 500)
assert.equal(positions[acc.sip.id], 12000)
assert.equal(positions[acc.stock.id], 8000)
assert.ok(positions[acc.loan.id] < 0)

step('the ledger list query: filters, ordering, range, and the account filter')
const list = await ok(a.from('entries').select('*, entry_items(id, name, amount)').neq('status', 'draft').order('entry_date', { ascending: false }).order('created_at', { ascending: false }).range(0, 25), 'list')
assert.equal(list.length, 5)
const byAccount = await ok(a.from('entries').select('id').neq('status', 'draft').or(`account_id.eq.${acc.sip.id},to_account_id.eq.${acc.sip.id}`), 'by account')
assert.equal(byAccount.length, 1)

step('paste: the anonymized samples become 5 drafts, one merged transfer, and a mandate suggestion')
const rules = await ok(a.from('merchant_rules').select('*'), 'rules')
let summary = await createDrafts({ text: F.ALL, accounts: Object.values(acc), categories, rules, today, db: a })
assert.deepEqual({ created: summary.created, duplicates: summary.duplicates, mandates: summary.mandatesSaved, errors: summary.errors }, { created: 5, duplicates: 0, mandates: 1, errors: [] })
summary = await createDrafts({ text: F.ALL, accounts: Object.values(acc), categories, rules, today, db: a })
assert.equal(summary.created, 0)
assert.equal(summary.duplicates, 5, 'pasting the same messages again adds nothing')
let drafts = await ok(a.from('entries').select('*').eq('status', 'draft'), 'drafts')
assert.equal(drafts.length, 5)
assert.ok(drafts.every((d) => !/\d{9,}/.test(d.raw_text)), 'no long digit runs are stored')
const transfer = drafts.find((d) => d.kind === 'transfer')
assert.equal(transfer.account_id, acc.bank.id)
assert.equal(transfer.to_account_id, acc.credit_card.id)
assert.equal(isComplete(transfer), true)
assert.equal((await ok(a.from('recurring_suggestions').select('*').eq('status', 'open'), 'suggestions')).length, 1)
const draftBalance = Object.fromEntries((await ok(a.rpc('account_positions', { p_at: today }), 'p')).map((p) => [p.account_id, Number(p.pos)]))
assert.equal(draftBalance[acc.bank.id], positions[acc.bank.id], 'drafts do not change balances')

step('confirm: an incomplete draft is refused; a completed one is confirmed and changes the balance')
const shop = drafts.find((d) => d.note === 'Test Vegetables')
const refused = await a.rpc('confirm_draft', { p_id: shop.id })
assert.ok(refused.error, 'no category yet')
await ok(a.from('entries').update({ category_id: cat('Groceries').id }).eq('id', shop.id), 'set category')
const confirmed = await ok(a.rpc('confirm_draft', { p_id: shop.id }), 'confirm')
assert.equal(confirmed.replaced, false)
await ok(a.from('merchant_rules').upsert({ merchant_key: shop.merchant_key, category_id: cat('Groceries').id, transfer_to_account_id: null }, { onConflict: 'user_id,merchant_key' }), 'rule 1')
await ok(a.from('merchant_rules').upsert({ merchant_key: shop.merchant_key, category_id: cat('Groceries').id, transfer_to_account_id: null }, { onConflict: 'user_id,merchant_key' }), 'rule 2 (same key)')
assert.equal((await ok(a.from('merchant_rules').select('*'), 'rules')).length, 1)
await ok(a.rpc('confirm_draft', { p_id: transfer.id }), 'confirm transfer')
const afterConfirm = Object.fromEntries((await ok(a.rpc('account_positions', { p_at: today }), 'p')).map((p) => [p.account_id, Number(p.pos)]))
assert.equal(afterConfirm[acc.bank.id], positions[acc.bank.id] - 163 - 64398)
assert.equal(afterConfirm[acc.credit_card.id], positions[acc.credit_card.id] + 64398, 'the card bill lowers what is owed, once')

step('recurring: create items as the form does, sync is repeatable, upcoming and Run now work')
const sub = await ok(a.from('recurring_items').insert({
  kind: 'subscription', name: 'Netflix', merchant_key: 'netflix', paying_account_id: acc.bank.id, linked_account_id: null,
  amount: 199, frequency: 'monthly', first_due_date: addDays(today, -65), track_from: addDays(today, -65),
}).select('*').single(), 'subscription')
const emi = await ok(a.from('recurring_items').insert({
  kind: 'emi', name: 'Car loan EMI', merchant_key: 'car loan emi', paying_account_id: acc.bank.id, linked_account_id: acc.loan.id,
  amount: null, frequency: null, first_due_date: '2026-01-01', track_from: addDays(today, -70),
}).select('*').single(), 'emi')
const first = await ok(a.rpc('sync_recurring', { p_as_of: today }), 'sync')
assert.ok(first.estimates_created >= 4, `estimates created: ${first.estimates_created}`)
const second = await ok(a.rpc('sync_recurring', { p_as_of: today }), 'sync again')
assert.equal(second.estimates_created, 0, 'syncing twice adds nothing')
const upcoming = await ok(a.rpc('upcoming_recurring', { p_from: today, p_to: addDays(today, 400) }), 'upcoming')
assert.ok(upcoming.some((u) => u.item_id === sub.id && u.due_date > today))
assert.ok(upcoming.some((u) => u.item_id === emi.id))
const insuranceItem = await ok(a.from('recurring_items').insert({
  kind: 'insurance', name: 'Term plan premium', merchant_key: 'term plan premium', paying_account_id: acc.bank.id,
  linked_account_id: acc.insurance.id, amount: null, frequency: null, first_due_date: addDays(today, 40), track_from: today,
}).select('id').single(), 'insurance item')
const dupLoan = await a.from('recurring_items').insert({
  kind: 'emi', name: 'Again', paying_account_id: acc.bank.id, linked_account_id: acc.loan.id, first_due_date: '2026-01-01',
})
assert.ok(dupLoan.error, 'a loan can only be tracked once')

step('recurring: a real debit replaces the estimate; a different amount asks to update')
const estimates = await ok(a.from('entries').select('*').eq('recurring_item_id', sub.id).eq('status', 'estimated').order('entry_date', { ascending: false }), 'estimates')
const latest = estimates[0]
const real = await ok(a.from('entries').insert({
  account_id: acc.bank.id, kind: 'expense', amount: 249, entry_date: latest.entry_date, category_id: cat('Subscriptions').id,
  status: 'draft', source: 'capture', merchant_key: 'netflix',
}).select('id').single(), 'real draft')
const result = await ok(a.rpc('confirm_draft', { p_id: real.id }), 'confirm recurring')
assert.equal(result.replaced, true)
assert.deepEqual({ expected: Number(result.amount_change.expected), actual: Number(result.amount_change.actual) }, { expected: 199, actual: 249 })
await ok(a.from('recurring_items').update({ amount: 249 }).eq('id', result.amount_change.item_id), 'update amount')
assert.equal((await ok(a.from('entries').select('id').eq('recurring_item_id', sub.id).eq('due_date', latest.due_date), 'one entry')).length, 1)

step('recurring: pause, resume without back-filling, end, and accepting the mandate suggestion')
await ok(a.from('recurring_items').update({ status: 'paused' }).eq('id', sub.id), 'pause')
await ok(a.from('recurring_items').update({ status: 'active', generated_through: today }).eq('id', sub.id), 'resume')
const afterResume = await ok(a.rpc('sync_recurring', { p_as_of: today }), 'sync after resume')
assert.equal(afterResume.estimates_created, 0)
await ok(a.from('recurring_items').update({ status: 'ended', end_date: today }).eq('id', insuranceItem.id), 'end')
const suggestion = (await ok(a.from('recurring_suggestions').select('*').eq('status', 'open'), 'open suggestions'))[0]
assert.equal(suggestion.merchant_key, 'apple media services')
await ok(a.from('recurring_items').insert({
  kind: 'subscription', name: suggestion.name, merchant_key: suggestion.merchant_key, paying_account_id: acc.bank.id,
  amount: suggestion.amount, frequency: 'monthly', first_due_date: suggestion.due_date, track_from: suggestion.due_date,
}), 'track suggestion')
await ok(a.from('recurring_suggestions').update({ status: 'accepted' }).eq('id', suggestion.id), 'accept')

step('goals: emergency fund (one only) and the bucket list with reordering')
await ok(a.from('goals').insert({ kind: 'emergency', name: 'Emergency fund', account_id: acc.bank.id, target_amount: null, emergency_first: true }), 'emergency')
assert.ok((await a.from('goals').insert({ kind: 'emergency', name: 'Second' })).error, 'second emergency fund must fail')
const laptop = await ok(a.from('goals').insert({ kind: 'bucket', name: 'Laptop', target_amount: 80000, saved_so_far: 1000, priority: 0 }).select('id').single(), 'laptop')
const phone = await ok(a.from('goals').insert({ kind: 'bucket', name: 'Phone', target_amount: 30000, saved_so_far: 0, priority: 1, target_date: addDays(today, 200) }).select('id').single(), 'phone')
await Promise.all([a.from('goals').update({ priority: 1 }).eq('id', laptop.id), a.from('goals').update({ priority: 0 }).eq('id', phone.id)])
assert.deepEqual((await ok(a.from('goals').select('name').eq('kind', 'bucket').order('priority'), 'order')).map((g) => g.name), ['Phone', 'Laptop'])
await ok(a.from('goals').update({ status: 'bought' }).eq('id', phone.id), 'bought')

step('freedom settings: defaults when none, upsert twice, ranges enforced')
assert.equal(await ok(a.from('freedom_settings').select('*').eq('user_id', A).maybeSingle(), 'none yet'), null)
await ok(a.from('freedom_settings').upsert({ user_id: A, multiplier: 30, annual_return: 0.09, inflation: 0.05 }, { onConflict: 'user_id' }), 'settings 1')
await ok(a.from('freedom_settings').upsert({ user_id: A, multiplier: 28, annual_return: 0.09, inflation: 0.05 }, { onConflict: 'user_id' }), 'settings 2')
assert.equal(Number((await ok(a.from('freedom_settings').select('*').eq('user_id', A).single(), 'settings')).multiplier), 28)
assert.ok((await a.from('freedom_settings').upsert({ user_id: A, multiplier: 5 }, { onConflict: 'user_id' })).error, 'multiplier 5 must fail')

step('insights: monthly summary, category spending and net worth (EMIs and SIP kept out of spending)')
const rows = await ok(a.rpc('monthly_summary', { p_from: monthStart(today), p_to: today }), 'summary')
assert.equal(rows.length, 1)
assert.equal(Number(rows[0].income), 60000)
assert.equal(Number(rows[0].sip), 2000)
assert.ok(Number(rows[0].emi) >= 0)
const spending = await ok(a.rpc('category_spending', { p_from: monthStart(today), p_to: today }), 'spending')
assert.ok(spending.find((s) => s.name === 'Groceries'))
assert.ok(!spending.find((s) => s.name === 'Salary'))
const net = await ok(a.rpc('net_worth_by_month', { p_from: addDays(today, -90), p_to: today }), 'net worth')
assert.ok(net.length >= 3)
assert.ok(Number(net[net.length - 1].assets) > 0)

step('averages and debt-free use the same data the pages use')
const firstEntry = await ok(a.from('entries').select('entry_date').neq('status', 'draft').order('entry_date', { ascending: true }).limit(1), 'first entry')
const range = averagingRange(firstEntry[0].entry_date, today)
const avg = monthlyAverages(await ok(a.rpc('monthly_summary', { p_from: range.from, p_to: range.to }), 'avg rows'))
assert.ok(avg.months >= 1)
const allAccounts = await ok(a.from('accounts').select('*'), 'accounts')
const debt = debtSummary({ loans: allAccounts.filter((x) => x.type === 'loan'), cards: [], today })
assert.equal(debt.loans.length, 1)

step('archive and delete rules for accounts')
const spare = await ok(a.from('accounts').insert(buildAccountRow({ ...emptyForm('bank'), name: 'Spare', opening: '0' })).select('id').single(), 'spare')
await ok(a.from('accounts').update({ archived_at: new Date().toISOString() }).eq('id', spare.id), 'archive')
await ok(a.from('accounts').delete().eq('id', spare.id), 'delete empty account')
const inUse = await a.from('accounts').delete().eq('id', acc.bank.id)
assert.equal(inUse.error?.code, '23503', 'an account with entries cannot be deleted')

step('privacy: user B sees and changes nothing of user A')
for (const table of ['accounts', 'account_values', 'entries', 'entry_items', 'merchant_rules', 'goals', 'freedom_settings', 'recurring_items', 'recurring_suggestions', 'profiles']) {
  assert.equal((await ok(b.from(table).select('*'), `B ${table}`)).length, table === 'profiles' ? 1 : 0, `B must not see ${table}`)
}
assert.deepEqual((await ok(b.rpc('account_positions', { p_at: today }), 'B positions')), [])
assert.equal(Number((await ok(b.rpc('monthly_summary', { p_from: monthStart(today), p_to: today }), 'B summary'))[0].income), 0)
await b.from('accounts').update({ name: 'hacked' }).eq('id', acc.bank.id)
await b.from('entries').delete().eq('id', salary.id)
assert.equal((await ok(a.from('accounts').select('name').eq('id', acc.bank.id).single(), 'A bank')).name, 'HDFC Savings')
assert.equal((await ok(a.from('entries').select('id').eq('id', salary.id), 'A salary')).length, 1)
assert.ok((await b.from('entries').insert({ user_id: A, account_id: acc.bank.id, kind: 'expense', amount: 1, category_id: cat('Fuel').id })).error, 'B cannot insert as A')
assert.ok((await b.from('entries').insert({ account_id: acc.bank.id, kind: 'expense', amount: 1, category_id: cat('Fuel').id })).error, 'B cannot use As account')

console.log(`ALL ${steps} API STEPS PASSED`)
