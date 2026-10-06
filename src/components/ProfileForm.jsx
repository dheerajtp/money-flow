import { useState } from 'react'
import Button from './Button.jsx'
import Notice from './Notice.jsx'
import TextField from './TextField.jsx'
import { errorMessage } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { ageOn, monthsToRetirement } from '../lib/retirement.js'
import { supabase } from '../lib/supabase.js'

export function describeMonths(months) {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts = []
  if (y) parts.push(`${y} year${y === 1 ? '' : 's'}`)
  if (m || !y) parts.push(`${m} month${m === 1 ? '' : 's'}`)
  return parts.join(' ')
}

export default function ProfileForm({ profile, onSaved }) {
  const [name, setName] = useState(profile.display_name || '')
  const [dob, setDob] = useState(profile.date_of_birth || '')
  const [age, setAge] = useState(String(profile.retirement_age))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const today = todayISO()

  const retirementAge = Number(age)
  const validAge = Number.isInteger(retirementAge) && retirementAge >= 30 && retirementAge <= 80
  const months = dob && validAge ? monthsToRetirement(dob, retirementAge, today) : null

  async function onSubmit(e) {
    e.preventDefault()
    const next = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (dob && (dob > today || dob < '1900-01-01')) next.dob = 'Enter a real date of birth.'
    if (!validAge) next.age = 'Enter a whole number from 30 to 80.'
    else if (dob && !next.dob && ageOn(dob, today) >= retirementAge) next.age = 'Retirement age must be later than your current age.'
    setErrors(next)
    setSaved(false)
    if (Object.keys(next).length) return
    setBusy(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), date_of_birth: dob || null, retirement_age: retirementAge })
      .eq('id', profile.id)
    setBusy(false)
    if (err) {
      setError(errorMessage(err))
      return
    }
    setSaved(true)
    onSaved?.()
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{saved ? 'Profile saved.' : ''}</Notice>
      <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <TextField label="Date of birth" type="date" max={today} value={dob} onChange={(e) => setDob(e.target.value)} error={errors.dob} hint="Used to work out how long until you stop working." />
      <TextField label="Age you want to stop working" type="number" inputMode="numeric" min="30" max="80" value={age} onChange={(e) => setAge(e.target.value)} error={errors.age} />
      {months !== null && (
        <p className="muted" role="status">
          {months === 0 ? 'You have reached that age.' : `Time left until then: ${describeMonths(months)}.`}
        </p>
      )}
      <div><Button type="submit" variant="primary" busy={busy}>Save profile</Button></div>
    </form>
  )
}
