import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SessionContext } from '../hooks/session-context.js'
import { addDays, todayISO } from '../lib/dates.js'

// A fake Supabase client: any query chain resolves to the rows we give it.
const db = vi.hoisted(() => ({ tables: {}, rpcs: {} }))

vi.mock('../lib/supabase.js', () => {
  function builder(rows) {
    let mode = 'many'
    const compute = () => {
      if (mode === 'single') return { data: rows[0], error: null }
      if (mode === 'maybe') return { data: rows[0] ?? null, error: null }
      return { data: rows, error: null, count: Array.isArray(rows) ? rows.length : 0 }
    }
    const b = new Proxy({}, {
      get(_, prop) {
        // Like the real client, a query is a thenable only: no .catch or .finally.
        if (prop === 'catch' || prop === 'finally') return undefined
        if (prop === 'then') return (res, rej) => Promise.resolve(compute()).then(res, rej)
        if (prop === 'single') return () => { mode = 'single'; return b }
        if (prop === 'maybeSingle') return () => { mode = 'maybe'; return b }
        return () => b
      },
    })
    return b
  }
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: (table) => builder(db.tables[table] || []),
      rpc: (name) => builder(db.rpcs[name] ?? []),
      auth: { signOut: () => Promise.resolve({}) },
    },
  }
})

import AppLayout from '../components/AppLayout.jsx'
import AccountsPage from './AccountsPage.jsx'
import CapturePage from './CapturePage.jsx'
import FreedomPage from './FreedomPage.jsx'
import GoalsPage from './GoalsPage.jsx'
import HomePage from './HomePage.jsx'
import InsightsPage from './InsightsPage.jsx'
import LedgerPage from './LedgerPage.jsx'
import ProfilePage from './ProfilePage.jsx'
import RecurringPage from './RecurringPage.jsx'

const base = { institution: null, last4: null, opening_balance: 0, linked_account_id: null, details: {}, archived_at: null, created_at: '2026-01-01' }
const accounts = [
  { ...base, id: 'b1', type: 'bank', name: 'HDFC Savings', last4: '1234', opening_balance: 1000 },
  { ...base, id: 'c1', type: 'credit_card', name: 'HDFC Card', last4: '9876', opening_balance: -2000, details: { credit_limit: 100000, statement_day: 1, due_day: 20 } },
  { ...base, id: 'd1', type: 'debit_card', name: 'HDFC Debit', linked_account_id: 'b1' },
  { ...base, id: 'l1', type: 'loan', name: 'Car loan', details: { emi_amount: 1000, emi_day: 5, first_emi_month: '2026-01-01', last_emi_month: '2099-12-01' } },
  { ...base, id: 's1', type: 'sip', name: 'Index SIP', details: { monthly_amount: 500, sip_day: 10 } },
  { ...base, id: 'k1', type: 'stock', name: 'Zerodha' },
  { ...base, id: 'i1', type: 'insurance', name: 'Term plan', details: { premium_amount: 1200, frequency: 'yearly', next_due_date: '2027-01-10' } },
]

function load() {
  db.tables = {
    accounts,
    profiles: [{ id: 'u1', display_name: 'Asha', date_of_birth: '1990-01-01', retirement_age: 55, updated_at: 'x' }],
    categories: [
      { id: 'cat1', name: 'Groceries', kind: 'expense', has_items: true, commitment_type: null, archived_at: null },
      { id: 'cat2', name: 'Salary', kind: 'income', has_items: false, commitment_type: null, archived_at: null },
      { id: 'cat3', name: 'Subscriptions', kind: 'expense', has_items: false, commitment_type: 'subscription', archived_at: null },
    ],
    entries: [
      { id: 'e1', account_id: 'b1', to_account_id: null, kind: 'expense', amount: 450, entry_date: '2026-07-10', category_id: 'cat1', note: 'Weekly shop', status: 'confirmed', entry_items: [{ id: 'i', name: 'Milk', amount: 60 }], updated_at: 'x', created_at: 'x', raw_text: null, merchant_key: null },
      { id: 'e2', account_id: 'b1', to_account_id: 'c1', kind: 'transfer', amount: 300, entry_date: '2026-07-11', category_id: null, note: null, status: 'estimated', entry_items: [], updated_at: 'x', created_at: 'x', raw_text: 'Sent Rs.300 [masked]', merchant_key: 'cred club' },
    ],
    goals: [
      { id: 'g1', kind: 'emergency', name: 'Emergency fund', account_id: 'b1', target_amount: null, emergency_first: true, priority: 0, status: 'active', updated_at: 'x' },
      { id: 'g2', kind: 'bucket', name: 'Laptop', target_amount: 80000, saved_so_far: 1000, priority: 0, status: 'active', target_date: '2099-01-01', note: null },
      { id: 'g3', kind: 'bucket', name: 'Old phone', target_amount: 20000, saved_so_far: 20000, priority: 1, status: 'bought', target_date: null, note: null },
    ],
    recurring_items: [
      { id: 'r1', kind: 'subscription', name: 'Netflix', merchant_key: 'netflix', paying_account_id: 'b1', linked_account_id: null, amount: 199, frequency: 'monthly', first_due_date: '2026-01-05', track_from: '2026-01-01', status: 'active', end_date: null },
      { id: 'r2', kind: 'emi', name: 'Car loan EMI', merchant_key: '', paying_account_id: 'b1', linked_account_id: 'l1', amount: null, frequency: null, first_due_date: '2026-01-01', track_from: '2026-01-01', status: 'paused', end_date: null },
    ],
    recurring_suggestions: [
      { id: 'sg1', name: 'Apple Media Services', merchant_key: 'apple media services', amount: 219, due_date: '2026-10-06', source: 'mandate', status: 'open', account_id: null },
    ],
    merchant_rules: [],
    freedom_settings: [],
  }
  const row = (m, income, expenses) => ({ month: m, income, expenses, subscriptions: 500, insurance: 100, emi: 1000, sip: 2000 })
  db.rpcs = {
    account_positions: [
      { account_id: 'b1', pos: 5000 }, { account_id: 'c1', pos: -1500 }, { account_id: 'l1', pos: -5000 },
      { account_id: 's1', pos: 12000 }, { account_id: 'k1', pos: 8000 },
    ],
    monthly_summary: [row('2026-08-01', 50000, 20000), row('2026-09-01', 52000, 21000)],
    category_spending: [{ category_id: 'cat1', name: 'Groceries', total: 8000 }, { category_id: 'cat3', name: 'Subscriptions', total: 500 }],
    net_worth_by_month: [
      { month: '2026-08-01', month_end: '2026-08-31', assets: 20000, liabilities: 5000, net: 15000 },
      { month: '2026-09-01', month_end: '2026-09-30', assets: 25000, liabilities: 5000, net: 20000 },
    ],
    upcoming_recurring: [{ item_id: 'r1', name: 'Netflix', kind: 'subscription', due_date: addDays(todayISO(), 2), amount: 199, paying_account_id: 'b1' }],
    sync_recurring: { estimates_created: 0, suggestions_created: 0 },
  }
}

function show(ui, tweak) {
  load()
  tweak?.()
  return render(
    <SessionContext.Provider value={{ session: { user: { id: 'u1', email: 'asha@example.com' } }, loading: false, recovery: false }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </SessionContext.Provider>,
  )
}

describe('the app shell', () => {
  it('finishes the recurring sync and then shows the page (it must not stay on loading)', async () => {
    load()
    render(
      <SessionContext.Provider value={{ session: { user: { id: 'u1', email: 'asha@example.com' } }, loading: false, recovery: false }}>
        <MemoryRouter initialEntries={['/x']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/x" element={<p>Page content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    )
    expect(await screen.findByText('Page content')).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Account menu/ }).length).toBeGreaterThan(0)
    expect(screen.getByRole('searchbox', { name: 'Search pages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Collapse sidebar/ })).toBeInTheDocument()
  })
})

describe('every page renders with realistic data', () => {
  it('Dashboard shows the dark net worth card, cash flow, saved, tabbed charts, transactions and paste card', async () => {
    show(<HomePage />)
    expect(await screen.findByRole('heading', { name: 'Net worth' })).toBeInTheDocument()
    for (const label of ['Cash flow', 'Money in', 'Money out', 'Saved', 'Savings rate', 'Recent transactions', 'Where it went', 'Paste a bank message']) {
      expect(screen.getAllByRole('heading', { name: label }).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('tablist', { name: 'Overview charts' })).toBeInTheDocument()
    expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByLabelText('Time period')).toBeInTheDocument()
  })

  it('Dashboard shows the Get started checklist to a new user and Hide removes it', async () => {
    localStorage.clear()
    show(<HomePage />, () => {
      db.tables.accounts = [accounts[0]]
      db.tables.goals = []
      db.tables.entries = []
      db.tables.profiles = [{ id: 'u1', display_name: 'Asha', date_of_birth: null }]
    })
    expect(await screen.findByRole('heading', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.getByText('1 of 5 steps done')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Setup progress' })).toHaveAttribute('aria-valuenow', '20')
    expect(screen.getByRole('link', { name: 'Add more' })).toHaveAttribute('href', '/accounts')
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
    expect(screen.queryByRole('heading', { name: 'Get started' })).not.toBeInTheDocument()
    expect(localStorage.getItem('onboarding-hidden')).toBe('1')
    localStorage.clear()
  })

  it('Dashboard has no checklist once every step is done', async () => {
    localStorage.clear()
    show(<HomePage />)
    expect(await screen.findByRole('heading', { name: 'Net worth' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Get started' })).not.toBeInTheDocument()
  })

  it('A user with no accounts sees the checklist beside the welcome art', async () => {
    localStorage.clear()
    show(<HomePage />, () => { db.tables.accounts = []; db.tables.goals = []; db.tables.entries = [] })
    expect(await screen.findByRole('heading', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.getByText('1 of 5 steps done')).toBeInTheDocument()
  })

  it('Accounts groups every account type and shows what is owed', async () => {
    show(<AccountsPage />)
    for (const group of ['Assets', 'Investments', 'Liabilities', 'Cards and policies']) {
      expect(await screen.findByRole('heading', { name: group })).toBeInTheDocument()
    }
    for (const name of ['HDFC Savings', 'HDFC Card', 'HDFC Debit', 'Car loan', 'Index SIP', 'Zerodha', 'Term plan']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Update value' })).toHaveLength(2)
  })

  it('Entries lists entries with items and an estimated badge, plus categories', async () => {
    show(<LedgerPage />)
    expect(await screen.findByText('Weekly shop', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(screen.getByText('Estimated')).toBeInTheDocument()
    expect(screen.getByText('Transfer to HDFC Card')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Filter entries' })).toBeInTheDocument()
  })

  it('Paste shows the paste box and the drafts waiting', async () => {
    show(<CapturePage />)
    expect(await screen.findByLabelText('Paste bank emails or SMS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How it works', hidden: true })).toBeInTheDocument()
    expect(screen.getByText('Fix anything, then confirm. Drafts change nothing until you do.')).toBeInTheDocument()
    expect(await screen.findByText(/Drafts to review/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm all complete drafts/ })).toBeInTheDocument()
  })

  it('Goals shows the emergency fund and the bucket list in order', async () => {
    show(<GoalsPage />)
    expect(await screen.findByRole('heading', { name: 'Emergency fund' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Emergency fund progress' })).toBeInTheDocument()
    expect(screen.getByText('1. Laptop')).toBeInTheDocument()
    expect(screen.getByText(/Bought or archived/)).toBeInTheDocument()
  })

  it('Graphs renders all five charts with table alternatives and facts', async () => {
    show(<InsightsPage />)
    for (const title of ['Facts', 'Spending by category', 'Income and expenses', 'Savings per month', 'Net worth', 'Monthly commitments']) {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.getAllByText('View as a table').length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText(/Subscriptions cost/)).toBeInTheDocument()
  })

  it('Recurring shows suggestions, upcoming payments, items and Run now', async () => {
    show(<RecurringPage />)
    expect(await screen.findByText('Apple Media Services')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Track it' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run now' })).toBeInTheDocument()
    const list = screen.getByRole('heading', { name: 'Your recurring payments' }).closest('section')
    expect(within(list).getByText('Netflix')).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('Freedom shows debt, the freedom number, the chart and the assumptions', async () => {
    show(<FreedomPage />)
    expect(await screen.findByRole('heading', { name: 'Debt-free' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Freedom by age 55/ })).toBeInTheDocument()
    expect(screen.getAllByText('Freedom number').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Assumptions' })).toBeInTheDocument()
    expect(screen.getByText(/not financial advice/)).toBeInTheDocument()
  })

  it('Profile shows the saved profile', async () => {
    show(<ProfilePage />)
    expect(await screen.findByLabelText('Your name')).toHaveValue('Asha')
    expect(screen.getByLabelText('Date of birth')).toHaveValue('1990-01-01')
  })

  it('Profile can bring the getting-started checklist back', async () => {
    localStorage.setItem('onboarding-hidden', '1')
    show(<ProfilePage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Show the getting-started checklist again' }))
    expect(localStorage.getItem('onboarding-hidden')).toBeNull()
    expect(await screen.findByText(/checklist is back/)).toBeInTheDocument()
  })
})
