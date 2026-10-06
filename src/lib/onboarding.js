const HIDDEN_KEY = 'onboarding-hidden'

// The getting-started steps. Each one completes by itself from real data.
export function onboardingSteps({ bankCount = 0, accountCount = 0, confirmedPastedCount = 0, goalCount = 0, hasDob = false }) {
  const steps = [
    { id: 'bank', title: 'Add a bank account', hint: 'Where your salary lands and your bills are paid from.', to: '/accounts', cta: 'Add account', done: bankCount >= 1 },
    { id: 'more', title: 'Add your cards, loans and SIPs', hint: 'Include the last 4 digits of each card so pasted messages match it.', to: '/accounts', cta: 'Add more', done: accountCount >= 2 },
    { id: 'paste', title: 'Paste your first bank message', hint: 'Then confirm the draft so it becomes an entry.', to: '/capture', cta: 'Paste one', done: confirmedPastedCount >= 1 },
    { id: 'goal', title: 'Set a goal', hint: 'An emergency fund, or something on your bucket list.', to: '/goals', cta: 'Set a goal', done: goalCount >= 1 },
    { id: 'dob', title: 'Add your date of birth', hint: 'Needed to work out your freedom date.', to: '/profile', cta: 'Open profile', done: Boolean(hasDob) },
  ]
  const doneCount = steps.filter((s) => s.done).length
  return { steps, doneCount, total: steps.length, complete: doneCount === steps.length }
}

// "Hide" is remembered in this browser only. Storage can be blocked, so every access is guarded.
export function readOnboardingHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

export function setOnboardingHidden(hidden) {
  try {
    if (hidden) localStorage.setItem(HIDDEN_KEY, '1')
    else localStorage.removeItem(HIDDEN_KEY)
  } catch {
    /* private mode: the card simply stays visible */
  }
}
