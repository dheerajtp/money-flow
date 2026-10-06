import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useSession from '../hooks/useSession.js'
import LoadingState from './LoadingState.jsx'

// Signed-out visitors go to /login. After a password-reset link, go set a new password.
export default function RequireAuth({ allowRecovery = false }) {
  const { session, loading, recovery } = useSession()
  const location = useLocation()
  if (loading) return <div className="page"><LoadingState label="Checking your session" /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (recovery && !allowRecovery) return <Navigate to="/update-password" replace />
  return <Outlet />
}
