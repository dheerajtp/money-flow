import { useEffect, useState } from 'react'
import { todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'

// Supabase calls are thenables, not full Promises, so they are awaited inside an async function.
async function sync() {
  try {
    await supabase.rpc('sync_recurring', { p_as_of: todayISO() })
  } catch {
    // The sync is best effort; pages still load without it.
  }
}

// Creates any missing estimated recurring entries when the app opens
// and when the tab becomes visible again. Safe to repeat.
export default function useRecurringSync() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    sync().then(() => {
      if (active) setReady(true)
    })
    function onVisible() {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return ready
}
