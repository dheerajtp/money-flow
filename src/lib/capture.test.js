import { describe, expect, it } from 'vitest'
import { createDrafts, isComplete, matchAccount } from './capture.js'
import * as F from './parser/fixtures.js'

const accounts = [
  { id: 'bank', type: 'bank', last4: '1234' },
  { id: 'card', type: 'credit_card', last4: '9876' },
  { id: 'old', type: 'bank', last4: '5555', archived_at: 'x' },
]
const categories = [
  { id: 'groc', kind: 'expense', name: 'Groceries' },
  { id: 'sal', kind: 'income', name: 'Salary' },
]

function fakeDb() {
  const seen = new Set()
  const db = {
    entries: [],
    suggestions: [],
    from(table) {
      return {
        async insert(row) {
          if (row.raw_hash) {
            if (seen.has(row.raw_hash)) return { error: { code: '23505', message: 'duplicate' } }
            seen.add(row.raw_hash)
          }
          db.entries.push(row)
          return { error: null }
        },
        async upsert(row) {
          if (table === 'recurring_suggestions') db.suggestions.push(row)
          return { error: null }
        },
      }
    },
  }
  return db
}

describe('matchAccount', () => {
  it('matches exactly one active account by last 4 digits', () => {
    expect(matchAccount(accounts, '1234').id).toBe('bank')
    expect(matchAccount(accounts, '5555')).toBeNull()
    expect(matchAccount(accounts, null)).toBeNull()
    expect(matchAccount([...accounts, { id: 'dup', last4: '1234' }], '1234')).toBeNull()
  })
})

describe('isComplete', () => {
  it('needs account, amount, date and a category (or a different destination for transfers)', () => {
    expect(isComplete({ kind: 'expense', account_id: 'a', amount: 5, entry_date: '2026-10-01', category_id: 'c' })).toBe(true)
    expect(isComplete({ kind: 'expense', account_id: 'a', amount: 5, entry_date: '2026-10-01' })).toBe(false)
    expect(isComplete({ kind: 'transfer', account_id: 'a', to_account_id: 'a', amount: 5, entry_date: '2026-10-01' })).toBe(false)
    expect(isComplete({ kind: 'transfer', account_id: 'a', to_account_id: 'b', amount: 5, entry_date: '2026-10-01' })).toBe(true)
  })
})

describe('createDrafts with the anonymized samples', () => {
  it('saves five drafts, one merged transfer, and keeps the mandate out of the entries', async () => {
    const db = fakeDb()
    const s = await createDrafts({ text: F.ALL, accounts, categories, rules: [], today: '2026-10-10', db })
    expect(s).toMatchObject({ messages: 7, created: 5, duplicates: 0, mandatesSaved: 1 })
    expect(db.entries).toHaveLength(5)
    const transfer = db.entries.find((e) => e.kind === 'transfer')
    expect(transfer).toMatchObject({ account_id: 'bank', to_account_id: 'card', amount: 64398, status: 'draft', source: 'capture' })
    expect(db.entries.filter((e) => e.kind === 'expense').every((e) => e.account_id === 'bank' && e.category_id === null)).toBe(true)
    expect(db.suggestions[0]).toMatchObject({ name: 'Apple Media Services', merchant_key: 'apple media services', amount: 219, due_date: '2026-10-06', source: 'mandate' })
  })
  it('masks long digit runs and never stores the raw reference numbers', async () => {
    const db = fakeDb()
    await createDrafts({ text: F.UPI_SHOP, accounts, categories, rules: [], today: '2026-10-10', db })
    expect(db.entries[0].raw_text).not.toMatch(/\d{9,}/)
    expect(db.entries[0].raw_text).toContain('[masked]')
  })
  it('counts a message pasted twice as a duplicate', async () => {
    const db = fakeDb()
    await createDrafts({ text: F.UPI_SHOP, accounts, categories, rules: [], today: '2026-10-10', db })
    const again = await createDrafts({ text: F.UPI_SHOP, accounts, categories, rules: [], today: '2026-10-10', db })
    expect(again).toMatchObject({ created: 0, duplicates: 1 })
  })
  it('uses remembered merchant rules for the category and the transfer card', async () => {
    const db = fakeDb()
    const rules = [
      { merchant_key: 'test vegetables', category_id: 'groc' },
      { merchant_key: 'cred club', transfer_to_account_id: 'card' },
    ]
    await createDrafts({ text: [F.UPI_SHOP, F.CRED_DEBIT].join('\n\n'), accounts, categories, rules, today: '2026-10-10', db })
    expect(db.entries.find((e) => e.note === 'Test Vegetables').category_id).toBe('groc')
    expect(db.entries.find((e) => e.kind === 'transfer')).toMatchObject({ account_id: 'bank', to_account_id: 'card' })
  })
  it('reports skipped and unreadable messages without saving them', async () => {
    const db = fakeDb()
    const s = await createDrafts({ text: [F.OTP, F.GIBBERISH].join('\n\n'), accounts, categories, rules: [], today: '2026-10-10', db })
    expect(s.created).toBe(0)
    expect(s.skipped).toHaveLength(1)
    expect(s.unreadable).toHaveLength(1)
    expect(db.entries).toHaveLength(0)
  })
})
