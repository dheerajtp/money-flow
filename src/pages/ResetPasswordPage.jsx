import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Notice from '../components/Notice.jsx'
import TextField from '../components/TextField.jsx'
import { supabase } from '../lib/supabase.js'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setBusy(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" lead="Enter your email and we will send you a reset link." footer={<Link to="/login">Back to log in</Link>}>
      {sent ? (
        <Notice kind="success">If that email has an account, a reset link is on its way.</Notice>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          <Notice kind="error">{error}</Notice>
          <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="primary" className="btn-block" busy={busy}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  )
}
