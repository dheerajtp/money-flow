// Unwrap a Supabase response: return data, or throw the error.
export async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

const FRIENDLY = {
  23505: 'That already exists.',
  23503: 'It is still used by other records.',
  42501: 'You are not allowed to do that.',
}

export function errorMessage(err) {
  if (!err) return ''
  return FRIENDLY[err.code] || err.message || 'Something went wrong. Please try again.'
}
