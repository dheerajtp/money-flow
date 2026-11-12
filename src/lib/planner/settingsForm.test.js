import { describe, expect, it } from 'vitest'
import { buildSettingsRow, emptySettingsForm, formFromSettings, suggestFloor, validateSettingsForm } from './settingsForm.js'

const ctx = { bankIds: ['b1', 'b2'], incomeCategoryIds: ['c1'] }
const good = { spendingAccountId: 'b1', salaryCategoryId: 'c1', salaryDay: '5', expectedSalary: '50,000', floor: '5000' }

describe('validateSettingsForm', () => {
  it('accepts a complete form', () => expect(validateSettingsForm(good, ctx)).toEqual({}))
  it('only allows bank accounts as the spending account', () => {
    expect(validateSettingsForm({ ...good, spendingAccountId: 'card-1' }, ctx).spendingAccountId).toBeTruthy()
    expect(validateSettingsForm({ ...good, spendingAccountId: '' }, ctx).spendingAccountId).toBeTruthy()
  })
  it('only allows income categories, and the category is optional', () => {
    expect(validateSettingsForm({ ...good, salaryCategoryId: 'groceries' }, ctx).salaryCategoryId).toBeTruthy()
    expect(validateSettingsForm({ ...good, salaryCategoryId: '' }, ctx)).toEqual({})
  })
  it('checks the salary day, floor and expected salary', () => {
    expect(validateSettingsForm({ ...good, salaryDay: '0' }, ctx).salaryDay).toBeTruthy()
    expect(validateSettingsForm({ ...good, salaryDay: '32' }, ctx).salaryDay).toBeTruthy()
    expect(validateSettingsForm({ ...good, salaryDay: '' }, ctx).salaryDay).toBeTruthy()
    expect(validateSettingsForm({ ...good, floor: '' }, ctx).floor).toBeTruthy()
    expect(validateSettingsForm({ ...good, floor: '-1' }, ctx).floor).toBeTruthy()
    expect(validateSettingsForm({ ...good, expectedSalary: 'abc' }, ctx).expectedSalary).toBeTruthy()
    expect(validateSettingsForm({ ...good, expectedSalary: '' }, ctx)).toEqual({})
  })
})

describe('settings row', () => {
  it('builds the database row', () => {
    expect(buildSettingsRow(good, 'u1')).toEqual({ user_id: 'u1', spending_account_id: 'b1', salary_category_id: 'c1', salary_day: 5, floor_amount: 5000, expected_salary_amount: 50000 })
  })
  it('stores blanks as null, never as an invented default', () => {
    const row = buildSettingsRow({ ...good, salaryCategoryId: '', expectedSalary: '' }, 'u1')
    expect(row.salary_category_id).toBeNull()
    expect(row.expected_salary_amount).toBeNull()
  })
  it('round-trips through the form', () => {
    const row = buildSettingsRow(good, 'u1')
    expect(formFromSettings(row)).toEqual({ spendingAccountId: 'b1', salaryCategoryId: 'c1', salaryDay: '5', expectedSalary: '50000', floor: '5000' })
    expect(formFromSettings(null)).toEqual(emptySettingsForm())
  })
})

describe('suggestFloor', () => {
  it('is 10% of the expected salary', () => {
    expect(suggestFloor('50000')).toBe(5000)
    expect(suggestFloor('12345')).toBe(1235)
  })
  it('is null without a usable salary', () => {
    expect(suggestFloor('')).toBeNull()
    expect(suggestFloor('x')).toBeNull()
  })
})
