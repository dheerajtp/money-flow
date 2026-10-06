import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Notice from '../components/Notice.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import useAsync from '../hooks/useAsync.js'
import useSession from '../hooks/useSession.js'
import { errorMessage, q } from '../lib/db.js'
import { setOnboardingHidden } from '../lib/onboarding.js'
import { supabase } from '../lib/supabase.js'

export default function ProfilePage() {
  const { session } = useSession()
  const userId = session.user.id
  const [restored, setRestored] = useState(false)
  const { data: profile, error, reload } = useAsync(
    () => q(supabase.from('profiles').select('*').eq('id', userId).single()),
    [userId],
  )

  return (
    <div className="stack">
      <PageHeader title="Your profile" subtitle="Your details and password." />
      {error && <Notice kind="error">{errorMessage(error)}</Notice>}
      {!profile && !error && <LoadingState />}
      {profile && (
        <Card title="About you">
          <p className="muted">Signed in as {session.user.email}</p>
          <ProfileForm key={profile.updated_at} profile={profile} onSaved={reload} />
        </Card>
      )}
      <Card title="Getting started">
        <p className="muted">The checklist on your dashboard hides itself once everything is done, or when you press Hide.</p>
        <Button onClick={() => { setOnboardingHidden(false); setRestored(true) }}>Show the getting-started checklist again</Button>
        <Notice kind="success">{restored ? 'Done. The checklist is back on your dashboard until you finish or hide it.' : ''}</Notice>
      </Card>
      <Card title="Password">
        <Link className="btn" to="/update-password">Change password</Link>
      </Card>
    </div>
  )
}
