import { beforeEach, describe, expect, it } from 'vitest'
import { onboardingSteps, readOnboardingHidden, setOnboardingHidden } from './onboarding.js'

describe('onboardingSteps', () => {
  it('starts with nothing done for a brand-new account', () => {
    const s = onboardingSteps({})
    expect(s.total).toBe(5)
    expect(s.doneCount).toBe(0)
    expect(s.complete).toBe(false)
    expect(s.steps.map((x) => x.id)).toEqual(['bank', 'more', 'paste', 'goal', 'dob'])
    expect(s.steps.every((x) => x.to.startsWith('/') && x.cta && x.hint)).toBe(true)
  })
  it('ticks each step from real data', () => {
    const s = onboardingSteps({ bankCount: 1, accountCount: 1 })
    expect(s.steps.find((x) => x.id === 'bank').done).toBe(true)
    expect(s.steps.find((x) => x.id === 'more').done).toBe(false)
    const t = onboardingSteps({ bankCount: 1, accountCount: 3, confirmedPastedCount: 2, goalCount: 1, hasDob: true })
    expect(t).toMatchObject({ doneCount: 5, complete: true })
  })
  it('does not count a single non-bank account as having a bank account', () => {
    const s = onboardingSteps({ bankCount: 0, accountCount: 1 })
    expect(s.steps[0].done).toBe(false)
  })
})

describe('hide flag', () => {
  beforeEach(() => localStorage.clear())
  it('remembers hiding and can be restored', () => {
    expect(readOnboardingHidden()).toBe(false)
    setOnboardingHidden(true)
    expect(readOnboardingHidden()).toBe(true)
    setOnboardingHidden(false)
    expect(readOnboardingHidden()).toBe(false)
  })
  it('never throws when storage is blocked', () => {
    const real = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('blocked') }
    expect(readOnboardingHidden()).toBe(false)
    Storage.prototype.getItem = real
  })
})
