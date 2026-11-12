import { parseAmount } from '../money.js'

export const emptySettingsForm = () => ({ spendingAccountId: '', salaryCategoryId: '', salaryDay: '', expectedSalary: '', floor: '' })

export function formFromSettings(s) {
  if (!s) return emptySettingsForm()
  const text = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    spendingAccountId: text(s.spending_account_id),
    salaryCategoryId: text(s.salary_category_id),
    salaryDay: text(s.salary_day),
    expectedSalary: text(s.expected_salary_amount),
    floor: text(s.floor_amount),
  }
}

// A starting point for the minimum balance: 10% of the expected salary, in whole rupees. The user can change it.
export function suggestFloor(expectedSalary) {
  const n = parseAmount(expectedSalary)
  return n && n > 0 ? Math.round(n * 0.1) : null
}

// Only bank accounts can be the spending account; only income categories can be the salary category.
export function validateSettingsForm(form, { bankIds, incomeCategoryIds }) {
  const errors = {}
  if (!form.spendingAccountId || !bankIds.includes(form.spendingAccountId)) errors.spendingAccountId = 'Choose one of your bank accounts.'
  if (form.salaryCategoryId && !incomeCategoryIds.includes(form.salaryCategoryId)) errors.salaryCategoryId = 'Choose an income category.'
  if (!/^\d+$/.test(form.salaryDay.trim()) || Number(form.salaryDay) < 1 || Number(form.salaryDay) > 31) errors.salaryDay = 'Enter a day from 1 to 31.'
  const floor = parseAmount(form.floor)
  if (floor === null || floor < 0) errors.floor = 'Enter 0 or more.'
  if (form.expectedSalary.trim() !== '') {
    const e = parseAmount(form.expectedSalary)
    if (e === null || e < 0) errors.expectedSalary = 'Enter 0 or more.'
  }
  return errors
}

export function buildSettingsRow(form, userId) {
  const expected = form.expectedSalary.trim() === '' ? null : parseAmount(form.expectedSalary)
  return {
    user_id: userId,
    spending_account_id: form.spendingAccountId,
    salary_category_id: form.salaryCategoryId || null,
    salary_day: Number(form.salaryDay),
    floor_amount: parseAmount(form.floor),
    expected_salary_amount: expected,
  }
}
