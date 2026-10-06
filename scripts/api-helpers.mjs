import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')

// A login token for the throwaway PostgREST used in local checks.
export function token(sub, secret, seconds = 3600) {
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + seconds })
  return `${head}.${body}.${createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`
}

export function clientFor(apiUrl, jwt) {
  return createClient(apiUrl, 'anon-key', {
    accessToken: async () => jwt,
    global: { fetch: (input, init) => fetch(String(input).replace('/rest/v1', ''), init) },
  })
}
