import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ configured: true }))

vi.mock('./lib/supabase.js', () => ({
  get isSupabaseConfigured() {
    return mocks.configured
  },
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

import App from './App.jsx'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.configured = true
})

describe('App', () => {
  it('explains how to connect Supabase when it is not configured', () => {
    mocks.configured = false
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Connect to Supabase' })).toBeInTheDocument()
  })

  it('sends signed-out visitors to the login page', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('sends signed-out visitors away from every private page', async () => {
    for (const path of ['/accounts', '/freedom', '/nope']) {
      const { unmount } = renderAt(path)
      expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
      unmount()
    }
  })

  it('validates the sign-up form before calling Supabase', async () => {
    renderAt('/signup')
    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
  })

  it('checks that the two passwords match', async () => {
    renderAt('/signup')
    await userEvent.type(await screen.findByLabelText('Your name'), 'Asha')
    await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'longenough1')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument()
  })
})
