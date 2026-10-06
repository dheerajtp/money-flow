import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { SessionContext } from '../hooks/session-context.js'

export default function SessionProvider({ children }) {
  const [state, setState] = useState({ session: null, loading: true, recovery: false })

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState((s) => ({ ...s, session: data.session, loading: false }))
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        loading: false,
        recovery: event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' ? false : s.recovery,
      }))
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}
