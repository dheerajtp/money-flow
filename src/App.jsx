import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import SessionProvider from './components/SessionProvider.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import AccountsPage from './pages/AccountsPage.jsx'
import CapturePage from './pages/CapturePage.jsx'
import ConfigErrorPage from './pages/ConfigErrorPage.jsx'
import GoalsPage from './pages/GoalsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LedgerPage from './pages/LedgerPage.jsx'
import LoadingState from './components/LoadingState.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RecurringPage from './pages/RecurringPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx'

// The chart pages pull in the charting library, so they load only when opened.
const FreedomPage = lazy(() => import('./pages/FreedomPage.jsx'))
const InsightsPage = lazy(() => import('./pages/InsightsPage.jsx'))

export default function App() {
  if (!isSupabaseConfigured) return <ConfigErrorPage />
  return (
    <SessionProvider>
      <Suspense fallback={<div className="page"><LoadingState /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth allowRecovery />}>
          <Route path="/update-password" element={<UpdatePasswordPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/freedom" element={<FreedomPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </SessionProvider>
  )
}
