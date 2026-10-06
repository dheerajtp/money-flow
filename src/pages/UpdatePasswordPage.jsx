import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Notice from '../components/Notice.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { MIN_PASSWORD } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

export default function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    const next = {}
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`
    if (confirm !== password) next.confirm = 'The passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) setError(err.message)
    else navigate('/', { replace: true })
  }

  return (
    <AuthLayout title="Choose a new password" lead="Use something you have not used before." footer={<Link to="/">Cancel</Link>}>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Notice kind="error">{error}</Notice>
        <PasswordField label="New password" autoComplete="new-password" hint={`At least ${MIN_PASSWORD} characters.`} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <Button type="submit" variant="primary" className="btn-block" busy={busy}>Save password</Button>
      </form>
    </AuthLayout>
  )
}
