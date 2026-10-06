// Rules for reading Indian bank / card / UPI messages.
export const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

export const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/gi
// An amount that follows these words is a balance or limit, never the payment.
export const NOT_AMOUNT_CONTEXT = /(avl\.?\s*bal|available\s*(?:limit|balance|bal)|balance|limit(?:\s+is)?)\s*[:-]?\s*$/i

export const DEBIT_RE = /\b(sent|debited|spent|paid|withdrawn|purchase[d]?|deducted)\b/i
export const CREDIT_RE = /\b(credited|deposited|refund(?:ed)?|received)\b/i
export const CARD_PAYMENT_RE = /payment\s+of\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+received\s+towards\s+your\s+credit\s+card/i
export const MANDATE_RE = /mandate/i
export const WILL_DEDUCT_RE = /will\s+be\s+deducted/i
export const OTP_RE = /\b(otp|one[- ]time\s+password|verification\s+code)\b/i
export const PROMO_RE = /\b(offer|cashback|discount|win\b|apply\s+now|pre[- ]approved|click\s+here|limited\s+time|congratulations)\b/i
export const BALANCE_ONLY_RE = /\b(avl\.?\s*bal|available\s*bal(?:ance)?|a\/c\s+balance)\b/i

export const NUMERIC_DATE_RE = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/
export const NAMED_DATE_RE = /\b(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s,]*(\d{2,4})\b/

export const LAST4_RE = /(?:\bending(?:\s+with)?\s+|(?:\bx{2,}|\*)\s*)(\d{4})(?!\d)/i
export const TO_LINE_RE = /^\s*to\s+(.+)$/im
export const AT_FOR_RE = /\b(?:at|for)\s+([A-Za-z][A-Za-z0-9 &.'@-]{1,40}?)(?=\s+(?:on|via|ref|using|mandate|ending)\b|[.,\n]|$)/i
export const INFO_RE = /info[:-]\s*([^\n]+)/i

// Payees that mean "this is a credit card bill payment".
export const CARD_BILL_PAYEE_RE = /\b(cred(?:\s+club)?|credit\s*card|cc\s*bill|card\s*payment)\b/i
