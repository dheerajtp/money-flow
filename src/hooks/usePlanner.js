import useAccounts from './useAccounts.js'
import useAsync from './useAsync.js'
import useSession from './useSession.js'
import { addDays } from '../lib/dates.js'
import { q } from '../lib/db.js'
import { buildPlanner } from '../lib/planner/safeToSpend.js'
import { computePayPeriod, latestSalaryDate, todayInTimeZone } from '../lib/planner/payPeriod.js'
import { supabase } from '../lib/supabase.js'

// Loads what the Planner needs and computes it. Recurring items are already synced before any
// page renders (AppLayout waits for sync_recurring), so items due today have their estimate.
// `planner` is null until a spending account is chosen.
export default function usePlanner() {
  const { session } = useSession()
  const userId = session.user.id
  const { data: accounts, error: accountsError } = useAccounts()
  const { data, error, reload } = useAsync(async () => {
    const today = todayInTimeZone()
    const settings = await q(supabase.from('planner_settings').select('*').eq('user_id', userId).maybeSingle())
    if (!settings?.spending_account_id) return { today, settings, entries: [], upcoming: [] }
    let salaryEntries = []
    if (settings.salary_category_id) {
      salaryEntries = await q(
        supabase.from('entries').select('*').eq('kind', 'income').eq('account_id', settings.spending_account_id)
          .eq('category_id', settings.salary_category_id).neq('status', 'draft').lte('entry_date', today)
          .order('entry_date', { ascending: false }).limit(1),
      )
    }
    const salaryDate = latestSalaryDate({ entries: salaryEntries, spendingAccountId: settings.spending_account_id, salaryCategoryId: settings.salary_category_id, today })
    const { end } = computePayPeriod({ today, salaryDay: Number(settings.salary_day) || 1, salaryDate })
    const [upcoming, posted] = await Promise.all([
      // p_from is exclusive, so start a day early to also see an item due today that has no estimate yet.
      q(supabase.rpc('upcoming_recurring', { p_from: addDays(today, -1), p_to: end })),
      q(supabase.from('entries').select('id, kind, status, account_id, recurring_item_id, due_date, amount').not('recurring_item_id', 'is', null).gte('due_date', today).lte('due_date', end)),
    ])
    return { today, settings, entries: [...salaryEntries, ...posted], upcoming }
  }, [userId])

  const planner = data && accounts ? buildPlanner({ ...data, accounts }) : null
  return { loading: !data || !accounts, error: error || accountsError, settings: data?.settings ?? null, accounts: accounts || [], planner, reload }
}
