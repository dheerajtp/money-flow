import { q } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'
import useAsync from './useAsync.js'

export default function useCategories() {
  return useAsync(() => q(supabase.from('categories').select('*').order('name', { ascending: true })), [])
}
