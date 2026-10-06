import { q } from '../lib/db.js'
import { todayISO } from '../lib/dates.js'
import { supabase } from '../lib/supabase.js'
import useAsync from './useAsync.js'

// All accounts with their current position (see account_positions in the database):
// bank = balance, credit card = minus owed, loan = minus remaining EMIs, SIP/stock = latest value.
export default function useAccounts() {
  return useAsync(async () => {
    const [accounts, positions] = await Promise.all([
      q(supabase.from('accounts').select('*').order('created_at', { ascending: true })),
      q(supabase.rpc('account_positions', { p_at: todayISO() })),
    ])
    const pos = new Map(positions.map((p) => [p.account_id, Number(p.pos)]))
    return accounts.map((a) => ({ ...a, opening_balance: Number(a.opening_balance), position: pos.get(a.id) ?? 0 }))
  }, [])
}
