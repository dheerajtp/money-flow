import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Notice from '../components/Notice.jsx'
import PasswordField from '../components/PasswordField.jsx'
import TextField from '../components/TextField.jsx'
import useSession from '../hooks/useSession.js'
import { MIN_PASSWORD } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

export default function SignUpPage() {
  const { session } = useSession()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [info, setInfo] = useState('')

  if (session) return <Navigate to="/" replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`
    if (form.confirm !== form.password) next.confirm = 'The passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    setError('')
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { display_name: form.name.trim() }, emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    if (data.session) navigate('/', { replace: true })
    else setSentTo(form.email.trim())
  }

  async function resend() {
    setBusy(true)
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: sentTo })
    setBusy(false)
    if (err) setError(err.message)
    else setInfo('Confirmation email sent again.')
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" lead="One more step before you can log in." footer={<Link to="/login">Back to log in</Link>}>
        <p>We sent a confirmation link to <strong>{sentTo}</strong>. Open it, then log in.</p>
        <Notice kind="error">{error}</Notice>
        <Notice kind="success">{info}</Notice>
        <Button className="btn-block" onClick={resend} busy={busy}>Resend confirmation email</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" lead="It takes a minute. Your data stays private to you." footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Notice kind="error">{error}</Notice>
        <TextField label="Your name" placeholder="Your full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="Email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordField label="Password" placeholder="Create a password" autoComplete="new-password" hint={`At least ${MIN_PASSWORD} characters.`} value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm password" placeholder="Repeat your password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" variant="primary" className="btn-block" busy={busy}>Create account</Button>
      </form>
    </AuthLayout>
  )
}
