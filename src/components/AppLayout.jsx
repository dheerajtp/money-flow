import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ConfirmModal from './ConfirmModal.jsx'
import LoadingState from './LoadingState.jsx'
import SidebarNav from './SidebarNav.jsx'
import TabBar from './TabBar.jsx'
import TopBar from './TopBar.jsx'
import useAsync from '../hooks/useAsync.js'
import useRecurringSync from '../hooks/useRecurringSync.js'
import useSession from '../hooks/useSession.js'
import { q } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

function readCollapsed() {
  try {
    return localStorage.getItem('sidebar-collapsed') === '1'
  } catch {
    return false
  }
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session } = useSession()
  const userId = session?.user?.id
  const ready = useRecurringSync()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  // Name for the profile card and the number of drafts waiting (refreshed when you move between pages).
  const { data: meta } = useAsync(async () => {
    if (!ready) return { name: '', drafts: 0 }
    const [profile, drafts] = await Promise.all([
      q(supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()),
      supabase.from('entries').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    ])
    return { name: profile?.display_name || '', drafts: drafts.count || 0 }
  }, [userId, ready, pathname])

  function toggleSidebar() {
    setCollapsed((c) => {
      try { localStorage.setItem('sidebar-collapsed', c ? '0' : '1') } catch { /* private mode */ }
      return !c
    })
  }

  async function logout() {
    setBusy(true)
    await supabase.auth.signOut()
    setBusy(false)
    setConfirming(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell" data-collapsed={collapsed}>
      <a href="#main" className="sr-only">Skip to content</a>
      <SidebarNav
        name={meta?.name}
        email={session?.user?.email}
        collapsed={collapsed}
        onToggle={toggleSidebar}
        onLogout={() => setConfirming(true)}
        draftCount={meta?.drafts || 0}
      />
      <div className="content">
        <TopBar name={meta?.name} email={session?.user?.email} draftCount={meta?.drafts || 0} onLogout={() => setConfirming(true)} />
        <main id="main" className="page">
          {ready ? <Outlet /> : <LoadingState label="Getting your data ready" />}
        </main>
      </div>
      <TabBar onLogout={() => setConfirming(true)} />
      <ConfirmModal
        open={confirming}
        title="Log out?"
        message="You will need to log in again to see your money."
        confirmLabel="Log out"
        busy={busy}
        onConfirm={logout}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
