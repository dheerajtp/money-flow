import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AccountForm from './AccountForm.jsx'
import Button from './Button.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import EmptyState from './EmptyState.jsx'
import Illustration from './Illustration.jsx'
import EntryItemsEditor from './EntryItemsEditor.jsx'
import MoneyText from './MoneyText.jsx'
import ProfileForm, { describeMonths } from './ProfileForm.jsx'
import Tabs from './Tabs.jsx'
import TextField from './TextField.jsx'

describe('Button and TextField', () => {
  it('disables a busy button and labels fields for screen readers', () => {
    render(<><Button busy>Save</Button><TextField label="Amount" error="Enter a number." /></>)
    expect(screen.getByRole('button')).toBeDisabled()
    const input = screen.getByLabelText('Amount')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a number.')
  })
})

describe('MoneyText', () => {
  it('formats rupees and says "owed" for liabilities', () => {
    const { container } = render(<MoneyText value={1234.5} owed />)
    expect(container).toHaveTextContent('₹1,234.50 owed')
    expect(container.querySelector('.cur')).toHaveTextContent('₹')
    expect(screen.getByText('owed')).toHaveClass('sr-only')
  })
})

describe('ConfirmModal', () => {
  it('is hidden until opened, focuses Cancel, and cancels on Escape', async () => {
    const onCancel = vi.fn()
    const { rerender } = render(<ConfirmModal open={false} title="Delete?" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    rerender(<ConfirmModal open title="Delete?" message="Sure?" confirmLabel="Delete" onConfirm={() => {}} onCancel={onCancel} />)
    expect(screen.getByRole('alertdialog', { name: 'Delete?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders in a portal on the body and confirms', async () => {
    const onConfirm = vi.fn()
    const { container } = render(<ConfirmModal open title="Log out?" message="m" confirmLabel="Log out" onConfirm={onConfirm} onCancel={() => {}} />)
    expect(container.querySelector('[role="alertdialog"]')).toBeNull()
    expect(document.body.querySelector('[role="alertdialog"]')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('keeps Tab inside the dialog', async () => {
    render(<ConfirmModal open title="t" message="m" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
})

describe('EntryItemsEditor', () => {
  it('shows the running total and adds and removes items', async () => {
    let items = [{ name: 'Milk', amount: '60' }]
    const onChange = vi.fn((next) => { items = next })
    const { rerender } = render(<EntryItemsEditor items={items} onChange={onChange} amount={100} />)
    expect(screen.getByRole('status')).toHaveTextContent('Items total ₹60.00 of ₹100.00')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(onChange).toHaveBeenLastCalledWith([{ name: 'Milk', amount: '60' }, { name: '', amount: '' }])
    rerender(<EntryItemsEditor items={items} onChange={onChange} amount={100} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove item 1' }))
    expect(onChange).toHaveBeenLastCalledWith([{ name: '', amount: '' }])
  })
})

describe('AccountForm', () => {
  it('shows field errors without saving when the form is invalid', async () => {
    const onSaved = vi.fn()
    render(<AccountForm banks={[]} onSaved={onSaved} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }))
    expect(screen.getByText('Enter a name.')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows the right fields for each account type', async () => {
    render(<AccountForm banks={[{ id: 'b', name: 'HDFC' }]} onSaved={() => {}} onCancel={() => {}} />)
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'loan')
    expect(screen.getByLabelText('Monthly EMI, interest included (₹)')).toBeInTheDocument()
    expect(screen.getByLabelText('Last EMI month')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'debit_card')
    expect(screen.getByLabelText('Spends from bank account')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'stock')
    expect(screen.queryByLabelText(/Balance/)).toBeNull()
  })
})

describe('AccountForm without a bank account', () => {
  it('explains that a debit card needs a bank first and offers to add one, instead of a dead-end error', async () => {
    render(<AccountForm banks={[]} onSaved={() => {}} onCancel={() => {}} />)
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'debit_card')
    expect(screen.getByText(/spends from a bank account, and you have not added one yet/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Spends from bank account')).toBeNull()
    expect(screen.getByRole('button', { name: 'Add account' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Add the bank account first' }))
    expect(screen.getByLabelText('Type')).toHaveValue('bank')
    expect(screen.getByRole('button', { name: 'Add account' })).toBeEnabled()
  })

  it('still offers the bank list once a bank account exists', async () => {
    render(<AccountForm banks={[{ id: 'b', name: 'HDFC Savings' }]} onSaved={() => {}} onCancel={() => {}} />)
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'debit_card')
    expect(screen.getByLabelText('Spends from bank account')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add account' })).toBeEnabled()
  })
})

describe('ProfileForm', () => {
  const profile = { id: 'u', display_name: 'Asha', date_of_birth: '', retirement_age: 55 }

  it('rejects a retirement age outside 30 to 80', async () => {
    render(<ProfileForm profile={profile} />)
    const age = screen.getByLabelText('Age you want to stop working')
    await userEvent.clear(age)
    await userEvent.type(age, '20')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('Enter a whole number from 30 to 80.')).toBeInTheDocument()
  })

  it('rejects a retirement age that is not later than the current age', async () => {
    render(<ProfileForm profile={{ ...profile, date_of_birth: '1950-01-01' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('Retirement age must be later than your current age.')).toBeInTheDocument()
  })

  it('describes time left in years and months', () => {
    expect(describeMonths(0)).toBe('0 months')
    expect(describeMonths(14)).toBe('1 year 2 months')
    expect(describeMonths(24)).toBe('2 years')
  })
})

describe('Illustration and EmptyState', () => {
  it('shows decorative art that screen readers skip', () => {
    const { container } = render(<Illustration name="calm" />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('alt', '')
    expect(img.getAttribute('src')).toContain('calm')
  })
  it('shows a title, a hint and either art or an icon', () => {
    const { container, rerender } = render(<EmptyState title="Nothing here" art="goals">Add something.</EmptyState>)
    expect(screen.getByRole('status')).toHaveTextContent('Nothing hereAdd something.')
    expect(container.querySelector('img')).not.toBeNull()
    rerender(<EmptyState title="Nothing here" icon="list" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })
})

describe('Tabs', () => {
  const tabs = [{ id: 'a', label: 'First' }, { id: 'b', label: 'Second' }, { id: 'c', label: 'Third' }]
  it('switches with the mouse and the arrow keys, and marks the selected tab', async () => {
    const onChange = vi.fn()
    render(<Tabs tabs={tabs} value="a" onChange={onChange} label="Demo" idPrefix="demo" />)
    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-controls', 'demo-panel-b')
    await userEvent.click(screen.getByRole('tab', { name: 'Second' }))
    expect(onChange).toHaveBeenLastCalledWith('b')
    screen.getByRole('tab', { name: 'First' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenLastCalledWith('c')
  })
  it('works as a group of toggle buttons for filters', async () => {
    const onChange = vi.fn()
    render(<Tabs mode="toggle" tabs={tabs} value="b" onChange={onChange} label="Filter" />)
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Third' }))
    expect(onChange).toHaveBeenCalledWith('c')
  })
})
