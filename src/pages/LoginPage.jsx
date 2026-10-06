import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Notice from '../components/Notice.jsx'
import PasswordField from '../components/PasswordField.jsx'
import TextField from '../components/TextField.jsx'
import useSession from '../hooks/useSession.js'
import { supabase } from '../lib/supabase.js'

export default function LoginPage() {
  const { session } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [info, setInfo] = useState('')

  if (session) return <Navigate to={location.state?.from || '/'} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    setUnconfirmed(false)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) {
      if (/not confirmed/i.test(err.message)) {
        setUnconfirmed(true)
        setError('Please confirm your email first. Check your inbox for the confirmation link.')
      } else {
        setError('Email or password is incorrect.')
      }
      return
    }
    navigate(location.state?.from || '/', { replace: true })
  }

  async function resend() {
    setBusy(true)
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setBusy(false)
    if (err) setError(err.message)
    else setInfo('Confirmation email sent again.')
  }

  return (
    <AuthLayout title="Log in" lead="Welcome back. Log in to see your money." footer={<>New here? <Link to="/signup">Create an account</Link></>}>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Notice kind="error">{error}</Notice>
        <Notice kind="success">{info}</Notice>
        <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" placeholder="Your password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="primary" className="btn-block" busy={busy}>Log in</Button>
        {unconfirmed && <Button className="btn-block" onClick={resend} disabled={busy}>Resend confirmation email</Button>}
        <Link className="auth-link" to="/reset-password">Forgot your password?</Link>
      </form>
    </AuthLayout>
  )
}
