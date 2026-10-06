import { q } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { averagingRange, monthlyAverages } from '../lib/monthlyAverages.js'
import { supabase } from '../lib/supabase.js'
import useAsync from './useAsync.js'

// Average monthly income, spending and savings over up to 3 full months
// (or the current month so far when there is no full month yet).
export default function useMonthlyAverages() {
  return useAsync(async () => {
    const first = await q(
      supabase.from('entries').select('entry_date').neq('status', 'draft')
        .order('entry_date', { ascending: true }).limit(1),
    )
    const range = averagingRange(first[0]?.entry_date, todayISO())
    if (!range) return { range: null, averages: null }
    const rows = await q(supabase.rpc('monthly_summary', { p_from: range.from, p_to: range.to }))
    return { range, averages: monthlyAverages(rows) }
  }, [])
}
