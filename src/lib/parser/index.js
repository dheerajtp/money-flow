import { normalizeMerchant } from '../merchant.js'
import { clampDate } from '../dates.js'
import {
  AMOUNT_RE, AT_FOR_RE, BALANCE_ONLY_RE, CARD_BILL_PAYEE_RE, CARD_PAYMENT_RE, CREDIT_RE, DEBIT_RE,
  INFO_RE, LAST4_RE, MANDATE_RE, MONTHS, NAMED_DATE_RE, NOT_AMOUNT_CONTEXT, NUMERIC_DATE_RE, OTP_RE,
  PROMO_RE, TO_LINE_RE, WILL_DEDUCT_RE,
} from './patterns.js'

// Messages are separated by one or more blank lines.
export function splitMessages(text) {
  return String(text ?? '')
    .split(/\n\s*\n+/)
    .map((m) => m.trim())
    .filter(Boolean)
}

// Any run of 9+ digits (card/account/reference/phone numbers) is hidden before storing.
export function maskLongDigits(text) {
  return String(text ?? '').replace(/\d{9,}/g, '[masked]')
}

export async function hashText(text) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
  const bytes = new TextEncoder().encode(normalized)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toNumber(s) {
  return Number(String(s).replace(/,/g, ''))
}

function fullYear(y) {
  return y < 100 ? 2000 + y : y
}

function validDate(y, m, d) {
  if (m < 1 || m > 12 || d < 1) return null
  const iso = clampDate(y, m, d)
  return Number(iso.slice(8, 10)) === d ? iso : null
}

export function findDate(text) {
  const named = text.match(NAMED_DATE_RE)
  if (named) {
    const m = MONTHS[named[2].toLowerCase()]
    if (m) {
      const iso = validDate(fullYear(Number(named[3])), m, Number(named[1]))
      if (iso) return iso
    }
  }
  const numeric = text.match(NUMERIC_DATE_RE)
  if (numeric) {
    const iso = validDate(fullYear(Number(numeric[3])), Number(numeric[2]), Number(numeric[1]))
    if (iso) return iso
  }
  return null
}

export function findAmount(text) {
  for (const match of text.matchAll(AMOUNT_RE)) {
    const before = text.slice(Math.max(0, match.index - 28), match.index)
    if (NOT_AMOUNT_CONTEXT.test(before)) continue
    const value = toNumber(match[1])
    if (value > 0) return value
  }
  return null
}

export function findLast4(text) {
  const m = text.match(LAST4_RE)
  return m ? m[1] : null
}

export function findMerchant(text) {
  const to = text.match(TO_LINE_RE)
  let raw = to ? to[1] : null
  if (!raw) raw = (text.match(INFO_RE) || text.match(AT_FOR_RE) || [])[1] || null
  if (!raw) return null
  const clean = raw.replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim().slice(0, 60)
  if (!clean || /^\d+$/.test(clean)) return null
  return clean
}

// Reads one message. Returns { type, ... } with type one of:
// transaction | card_payment | mandate | skip | unreadable.
export function parseMessage(raw, { today } = {}) {
  const text = String(raw ?? '').trim()
  const date = findDate(text) || today || null
  const last4 = findLast4(text)

  const cardPayment = text.match(CARD_PAYMENT_RE)
  if (cardPayment) {
    return { type: 'card_payment', amount: toNumber(cardPayment[1]), date, last4, raw: text }
  }

  if (MANDATE_RE.test(text) && WILL_DEDUCT_RE.test(text)) {
    const amount = findAmount(text)
    const merchant = (text.match(/\bfor\s+(.+?)\s+mandate\b/i) || [])[1] || null
    const dueMatch = text.match(/deducted\s+on\s+(.+)/i)
    const dueDate = (dueMatch && findDate(dueMatch[1])) || date
    if (amount && merchant) {
      return {
        type: 'mandate', amount, dueDate, merchant: merchant.trim(),
        merchantKey: normalizeMerchant(merchant), last4, raw: text,
      }
    }
  }

  const hasDebit = DEBIT_RE.test(text)
  const hasCredit = CREDIT_RE.test(text)

  if (OTP_RE.test(text) && !/\b(debited|credited|spent|withdrawn|deposited)\b/i.test(text)) {
    return { type: 'skip', reason: 'OTP message', raw: text }
  }
  if (!hasDebit && !hasCredit) {
    if (PROMO_RE.test(text)) return { type: 'skip', reason: 'promotion', raw: text }
    if (BALANCE_ONLY_RE.test(text)) return { type: 'skip', reason: 'balance alert, not a transaction', raw: text }
  }

  const amount = findAmount(text)
  if (!amount || (!hasDebit && !hasCredit)) return { type: 'unreadable', raw: text }

  const kind = hasDebit ? 'expense' : 'income'
  const merchant = findMerchant(text)
  return {
    type: 'transaction', kind, amount, date, last4, merchant,
    merchantKey: merchant ? normalizeMerchant(merchant) : null,
    suggestTransfer: kind === 'expense' && Boolean(merchant) && CARD_BILL_PAYEE_RE.test(merchant),
    raw: text,
  }
}

// Turns parsed messages into drafts to review. A bank debit to a card-bill payee
// and the card's "payment received" message become ONE transfer.
// Returns { drafts, skipped, unreadable, mandates }.
export function buildDrafts(parsed) {
  const drafts = []
  const skipped = []
  const unreadable = []
  const mandates = []
  const cardPayments = parsed.filter((p) => p.type === 'card_payment')
  const usedCard = new Set()

  for (const p of parsed) {
    if (p.type === 'skip') skipped.push(p)
    else if (p.type === 'unreadable') unreadable.push(p)
    else if (p.type === 'mandate') mandates.push(p)
    else if (p.type === 'transaction') {
      if (p.suggestTransfer) {
        const match = cardPayments.find((c) => !usedCard.has(c) && c.amount === p.amount && c.date === p.date)
        if (match) usedCard.add(match)
        drafts.push({
          kind: 'transfer', amount: p.amount, date: p.date, fromLast4: p.last4,
          toLast4: match ? match.last4 : null, merchant: p.merchant, merchantKey: p.merchantKey,
          raws: match ? [p.raw, match.raw] : [p.raw],
        })
      } else {
        drafts.push({
          kind: p.kind, amount: p.amount, date: p.date, last4: p.last4,
          merchant: p.merchant, merchantKey: p.merchantKey, raws: [p.raw],
        })
      }
    }
  }
  for (const c of cardPayments) {
    if (usedCard.has(c)) continue
    drafts.push({
      kind: 'transfer', amount: c.amount, date: c.date, fromLast4: null, toLast4: c.last4,
      merchant: null, merchantKey: null, raws: [c.raw],
    })
  }
  return { drafts, skipped, unreadable, mandates }
}
