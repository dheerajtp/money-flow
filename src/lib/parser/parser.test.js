import { describe, expect, it } from 'vitest'
import { buildDrafts, hashText, maskLongDigits, parseMessage, splitMessages } from './index.js'
import * as F from './fixtures.js'

const today = '2026-10-10'

describe('splitMessages', () => {
  it('splits on one or more blank lines and keeps multi-line messages together', () => {
    const parts = splitMessages(F.ALL)
    expect(parts).toHaveLength(7)
    expect(parts[0]).toBe(F.UPI_SHOP)
  })
  it('returns one message when there is no blank line', () => {
    expect(splitMessages(F.UPI_SHOP)).toHaveLength(1)
    expect(splitMessages('   \n  ')).toEqual([])
  })
})

describe('parseMessage: UPI payments', () => {
  it('reads a payment to a shop', () => {
    expect(parseMessage(F.UPI_SHOP, { today })).toMatchObject({
      type: 'transaction', kind: 'expense', amount: 163, date: '2026-10-05', last4: '1234',
      merchant: 'Test Vegetables', merchantKey: 'test vegetables', suggestTransfer: false,
    })
  })
  it('reads a payment to a person', () => {
    expect(parseMessage(F.UPI_PERSON, { today })).toMatchObject({ kind: 'expense', amount: 220, merchant: 'Test Person' })
  })
  it('reads a payment to a UPI id and an older date', () => {
    expect(parseMessage(F.UPI_ID, { today })).toMatchObject({ amount: 1000, date: '2026-09-29', merchant: 'someone@okbank' })
  })
  it('flags a payment to a card-bill payee as a likely transfer', () => {
    expect(parseMessage(F.CRED_DEBIT, { today })).toMatchObject({ amount: 64398, suggestTransfer: true })
  })
})

describe('parseMessage: other messages', () => {
  it('reads a deposit as income and ignores the available balance', () => {
    const p = parseMessage(F.DEPOSIT, { today })
    expect(p).toMatchObject({ type: 'transaction', kind: 'income', amount: 58242, date: '2026-10-05', last4: '1234', merchant: null })
  })
  it('does not treat a card payment "received" as income', () => {
    expect(parseMessage(F.CARD_PAYMENT, { today })).toEqual({
      type: 'card_payment', amount: 64398, date: '2026-10-05', last4: '9876', raw: F.CARD_PAYMENT,
    })
  })
  it('reads an e-mandate as a future payment, not a transaction', () => {
    expect(parseMessage(F.MANDATE, { today })).toMatchObject({
      type: 'mandate', amount: 219, dueDate: '2026-10-06', merchant: 'APPLE MEDIA SERVICES', merchantKey: 'apple media services',
    })
  })
  it('skips OTPs, promotions and balance alerts', () => {
    expect(parseMessage(F.OTP, { today })).toMatchObject({ type: 'skip', reason: 'OTP message' })
    expect(parseMessage(F.PROMO, { today })).toMatchObject({ type: 'skip', reason: 'promotion' })
    expect(parseMessage(F.BALANCE_ONLY, { today }).type).toBe('skip')
  })
  it('marks messages it cannot read', () => {
    expect(parseMessage(F.GIBBERISH, { today }).type).toBe('unreadable')
  })
  it('uses today when a message has no date', () => {
    expect(parseMessage('Rs.50.00 debited from A/c XX1234 at Test Cafe', { today })).toMatchObject({ date: today, amount: 50, merchant: 'Test Cafe' })
  })
})

describe('buildDrafts', () => {
  const parsed = splitMessages(F.ALL).map((m) => parseMessage(m, { today }))

  it('merges the CRED debit and the card payment into ONE transfer', () => {
    const { drafts } = buildDrafts(parsed)
    const transfers = drafts.filter((d) => d.kind === 'transfer')
    expect(transfers).toHaveLength(1)
    expect(transfers[0]).toMatchObject({ amount: 64398, fromLast4: '1234', toLast4: '9876', date: '2026-10-05' })
    expect(transfers[0].raws).toHaveLength(2)
  })
  it('gives one draft per transaction and keeps the mandate out of the drafts', () => {
    const { drafts, mandates, skipped, unreadable } = buildDrafts(parsed)
    expect(drafts).toHaveLength(5)
    expect(mandates).toHaveLength(1)
    expect(skipped).toHaveLength(0)
    expect(unreadable).toHaveLength(0)
    expect(drafts.filter((d) => d.kind === 'expense')).toHaveLength(3)
    expect(drafts.filter((d) => d.kind === 'income')).toHaveLength(1)
  })
  it('keeps a lone card payment as a transfer with the source left blank', () => {
    const { drafts } = buildDrafts([parseMessage(F.CARD_PAYMENT, { today })])
    expect(drafts).toEqual([expect.objectContaining({ kind: 'transfer', fromLast4: null, toLast4: '9876' })])
  })
  it('keeps a lone bank debit to a card-bill payee as a transfer with the card left blank', () => {
    const { drafts } = buildDrafts([parseMessage(F.CRED_DEBIT, { today })])
    expect(drafts[0]).toMatchObject({ kind: 'transfer', fromLast4: '1234', toLast4: null })
  })
  it('does not merge when the amount or date differs', () => {
    const other = parseMessage(F.CARD_PAYMENT.replace('64398.00', '100.00'), { today })
    const { drafts } = buildDrafts([parseMessage(F.CRED_DEBIT, { today }), other])
    expect(drafts.filter((d) => d.kind === 'transfer')).toHaveLength(2)
  })
})

describe('masking and hashing', () => {
  it('hides runs of 9 or more digits but keeps amounts', () => {
    expect(maskLongDigits('Ref 130000000001 call 18001234567 Rs.58,242.00 *1234')).toBe('Ref [masked] call [masked] Rs.58,242.00 *1234')
  })
  it('hashes the same text the same way regardless of spacing and case', async () => {
    const a = await hashText('Sent  Rs.10\nTo X')
    const b = await hashText('sent rs.10 to x')
    const c = await hashText('sent rs.11 to x')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
