// Realistic demo data for local visual checks (a throwaway database only).
import assert from 'node:assert/strict'
import { buildAccountRow, emptyForm } from '../src/lib/accountFields.js'
import { createDrafts } from '../src/lib/capture.js'
import { addDays, addMonths, monthStart, todayISO } from '../src/lib/dates.js'
import * as F from '../src/lib/parser/fixtures.js'

async function ok(promise, label) {
  const { data, error } = await promise
  assert.equal(error, null, `${label}: ${error?.message}`)
  return data
}

export async function seedDemo(db, userId) {
  const today = todayISO()
  await ok(db.from('profiles').update({ display_name: 'Asha Menon', date_of_birth: '1990-04-01', retirement_age: 55 }).eq('id', userId), 'profile')
  const cats = await ok(db.from('categories').select('*'), 'categories')
  const cat = (n) => cats.find((c) => c.name === n).id

  const make = async (type, over) => (await ok(db.from('accounts').insert(buildAccountRow({ ...emptyForm(type), ...over })).select('*').single(), type))
  const bank = await make('bank', { name: 'HDFC Savings', institution: 'HDFC Bank', last4: '1234', opening: '85000' })
  const emergency = await make('bank', { name: 'Emergency Fund', institution: 'Kotak', opening: '120000' })
  const card = await make('credit_card', { name: 'HDFC Regalia', institution: 'HDFC Bank', last4: '9876', opening: '12000', credit_limit: '250000', statement_day: '1', due_day: '20' })
  await make('debit_card', { name: 'HDFC Debit', last4: '5555', linked_account_id: bank.id })
  const home = await make('loan', { name: 'Home loan', institution: 'SBI', emi_amount: '32000', emi_day: '5', first_emi_month: '2022-03', last_emi_month: '2031-02' })
  const bike = await make('loan', { name: 'Bike loan', institution: 'Bajaj Finance', emi_amount: '4500', emi_day: '8', first_emi_month: '2025-01', last_emi_month: '2027-12' })
  const sipA = await make('sip', { name: 'Nifty 50 index SIP', monthly_amount: '15000', sip_day: '10' })
  const sipB = await make('sip', { name: 'Flexi cap SIP', monthly_amount: '10000', sip_day: '10' })
  const stocks = await make('stock', { name: 'Zerodha', institution: 'Zerodha' })
  await make('insurance', { name: 'Term life', institution: 'HDFC Life', premium_amount: '18000', frequency: 'yearly', next_due_date: addDays(today, 40) })
  const setValue = (a, v, d = today) => ok(db.from('account_values').upsert({ account_id: a.id, as_of: d, value: v }, { onConflict: 'account_id,as_of' }), 'value')
  for (const k of [3, 2, 1]) {
    const d = addMonths(monthStart(today), -k)
    await setValue(sipA, 380000 + (3 - k) * 26000, d)
    await setValue(sipB, 250000 + (3 - k) * 19000, d)
    await setValue(stocks, 190000 + (3 - k) * 8000, d)
  }
  await setValue(sipA, 460000)
  await setValue(sipB, 310000)
  await setValue(stocks, 215000)

  const rows = []
  const add = (date, account, kind, amount, category, note, extra = {}) => {
    if (date <= today) rows.push({ account_id: account.id, kind, amount, entry_date: date, category_id: category ? cat(category) : null, note, ...extra })
  }
  for (const k of [3, 2, 1, 0]) {
    const m = addMonths(monthStart(today), -k)
    const day = (n) => addDays(m, n - 1)
    add(day(1), bank, 'income', 142000, 'Salary', 'Salary')
    add(day(2), bank, 'transfer', 10000, null, 'Emergency top-up', { to_account_id: emergency.id })
    add(day(3), bank, 'expense', 28000, 'Rent', 'Rent')
    add(day(5), bank, 'transfer', 32000, null, 'Home loan EMI', { to_account_id: home.id })
    add(day(5), bank, 'expense', 649, 'Subscriptions', 'Netflix', { merchant_key: 'netflix' })
    add(day(6), bank, 'expense', 219, 'Subscriptions', 'Apple Media Services', { merchant_key: 'apple media services' })
    add(day(7), bank, 'expense', 119, 'Subscriptions', 'Spotify', { merchant_key: 'spotify' })
    add(day(8), bank, 'transfer', 4500, null, 'Bike loan EMI', { to_account_id: bike.id })
    add(day(10), bank, 'transfer', 15000, null, 'SIP', { to_account_id: sipA.id })
    add(day(10), bank, 'transfer', 10000, null, 'SIP', { to_account_id: sipB.id })
    for (const [d, a] of [[6, 2450], [12, 3180], [19, 2760], [26, 3920]]) add(day(d), bank, 'expense', a + k * 130, 'Groceries', 'Groceries')
    for (const [d, a] of [[9, 1450], [17, 980], [24, 2200]]) add(day(d), bank, 'expense', a, 'Food & Dining', 'Restaurant')
    add(day(11), bank, 'expense', 3200, 'Fuel', 'Fuel')
    add(day(15), bank, 'expense', 2250 + k * 90, 'Bills & Utilities', 'Electricity')
    add(day(14), card, 'expense', 6400 + k * 700, 'Shopping', 'Shopping')
    add(day(20), card, 'expense', 12800, 'Travel', 'Weekend trip')
    add(day(22), card, 'expense', 3100, 'Food & Dining', 'Dining out')
    add(day(12), bank, 'transfer', 21000, null, 'Credit card bill', { to_account_id: card.id })
  }
  await ok(db.from('entries').insert(rows), 'entries')
  const items = await ok(db.from('entries').select('id').eq('category_id', cat('Groceries')).order('entry_date', { ascending: false }).limit(1), 'one grocery')
  await ok(db.from('entry_items').insert([{ entry_id: items[0].id, name: 'Rice 10kg', amount: 780 }, { entry_id: items[0].id, name: 'Vegetables', amount: 640 }, { entry_id: items[0].id, name: 'Milk and eggs', amount: 520 }]), 'items')

  await ok(db.from('goals').insert({ kind: 'emergency', name: 'Emergency fund', account_id: emergency.id, target_amount: null, emergency_first: true }), 'emergency')
  await ok(db.from('goals').insert([
    { kind: 'bucket', name: 'Goa trip', target_amount: 65000, saved_so_far: 20000, priority: 0, target_date: addDays(today, 120) },
    { kind: 'bucket', name: 'MacBook Pro', target_amount: 189000, saved_so_far: 40000, priority: 1, target_date: addDays(today, 270) },
    { kind: 'bucket', name: 'Kitchen upgrade', target_amount: 120000, saved_so_far: 0, priority: 2 },
  ]), 'bucket list')

  const sub = (name, key, amount, first) => ({ kind: 'subscription', name, merchant_key: key, paying_account_id: bank.id, amount, frequency: 'monthly', first_due_date: first, track_from: today })
  await ok(db.from('recurring_items').insert([
    sub('Netflix', 'netflix', 649, addDays(today, 3)),
    sub('Spotify', 'spotify', 119, addDays(today, 5)),
    { kind: 'emi', name: 'Home loan EMI', merchant_key: 'home loan emi', paying_account_id: bank.id, linked_account_id: home.id, first_due_date: '2022-03-01', track_from: today },
  ]), 'recurring')

  const [rules, accounts, categories] = await Promise.all([ok(db.from('merchant_rules').select('*'), 'rules'), ok(db.from('accounts').select('*'), 'accounts'), ok(db.from('categories').select('*'), 'cats')])
  await createDrafts({ text: F.ALL, accounts, categories, rules, today, db })
  await ok(db.rpc('sync_recurring', { p_as_of: today }), 'sync')
}
