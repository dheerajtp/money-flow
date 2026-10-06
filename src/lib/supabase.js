import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only the public URL and anon key are ever used in the browser.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key')
