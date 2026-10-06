/* global document, getComputedStyle */
// Starts the real app against seeded demo data and takes local screenshots with headless Chrome.
// Nothing leaves this machine. Run through supabase/test/visual.sh.
import { spawn } from 'node:child_process'
import { createServer, request } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { clientFor, token } from './api-helpers.mjs'
import { seedDemo } from './seed-demo.mjs'

const { API_URL, JWT_SECRET, PG_EXEC, SHOT_DIR } = process.env
const PROXY_PORT = 3998
const APP_PORT = 5197
mkdirSync(SHOT_DIR, { recursive: true })

const userId = randomUUID()
const { execSync } = await import('node:child_process')
execSync(PG_EXEC, { input: `insert into auth.users (id, email, raw_user_meta_data) values ('${userId}','asha@example.com','{"display_name":"Asha Menon"}');` })
const jwt = token(userId, JWT_SECRET, 7200)
const emptyId = randomUUID()
execSync(PG_EXEC, { input: `insert into auth.users (id, email, raw_user_meta_data) values ('${emptyId}','new@example.com','{"display_name":"Sam Rao"}');` })
const emptyJwt = token(emptyId, JWT_SECRET, 7200)
await seedDemo(clientFor(API_URL, jwt), userId)
console.log('demo data seeded')

// supabase-js calls /rest/v1/...; PostgREST serves from /. Also allow the browser (CORS).
const proxy = createServer((req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': req.headers['access-control-request-headers'] || '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' }
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  const target = new URL(API_URL)
  const upstream = request({ host: target.hostname, port: target.port, path: req.url.replace('/rest/v1', ''), method: req.method, headers: { ...req.headers, host: target.host } }, (r) => {
    res.writeHead(r.statusCode, { ...r.headers, ...cors })
    r.pipe(res)
  })
  req.pipe(upstream)
})
await new Promise((r) => proxy.listen(PROXY_PORT, '127.0.0.1', r))

const vite = spawn('npx', ['vite', '--port', String(APP_PORT), '--strictPort', '--host', '127.0.0.1'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: { ...process.env, VITE_SUPABASE_URL: `http://127.0.0.1:${PROXY_PORT}`, VITE_SUPABASE_ANON_KEY: 'anon-key' },
  stdio: 'ignore',
  detached: true,
})
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(`http://127.0.0.1:${APP_PORT}/login`)).ok) break } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 500))
}

const makeSession = (id, email, jwtValue) => JSON.stringify({
  access_token: jwtValue, refresh_token: 'unused', token_type: 'bearer', expires_in: 7200,
  expires_at: Math.floor(Date.now() / 1000) + 7200,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
})
const session = makeSession(userId, 'asha@example.com', jwt)
const emptySession = makeSession(emptyId, 'new@example.com', emptyJwt)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
async function shoot(name, path, { width, height, signedIn = true, full = true, settle = 900, action, empty = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  if (signedIn) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ['sb-127-auth-token', empty ? emptySession : session])
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`http://127.0.0.1:${APP_PORT}${path}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(settle)
  if (action) await action(page)
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth <= vw) return null
    const out = []
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX
        if (o !== 'visible' && p.getBoundingClientRect().right <= vw + 1) return true
      }
      return false
    }
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.right > vw + 1 && r.width > 0 && !clipped(el) && getComputedStyle(el).position !== 'fixed') out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`)
    }
    const wide = []
    for (const el of document.body.querySelectorAll('*')) {
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth > 0) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} scroll=${el.scrollWidth} client=${el.clientWidth}`)
    }
    const culprits = []
    const root = document.getElementById('main')
    const sections = [...root.querySelectorAll('section, header, nav, ul, div')].filter((el) => el.parentElement === root || el.parentElement?.parentElement === root || el.parentElement?.parentElement?.parentElement === root)
    for (const el of sections) {
      const prev = el.style.display
      el.style.display = 'none'
      if (document.documentElement.scrollWidth <= vw) culprits.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`)
      el.style.display = prev
    }
    const chain = []
    for (let el = document.querySelector('.tiles'); el && el !== document.documentElement; el = el.parentElement) {
      const cs = getComputedStyle(el)
      chain.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 24)} w=${Math.round(el.getBoundingClientRect().width)} sw=${el.scrollWidth} disp=${cs.display} ox=${cs.overflowX} minw=${cs.minWidth}`)
    }
    return { scrollWidth: document.documentElement.scrollWidth, vw, culprits, chain }
  })
  if (overflow) errors.push(`HORIZONTAL OVERFLOW ${JSON.stringify(overflow)}`)
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: full })
  console.log(`${name}${errors.length ? `  !! ${errors.slice(0, 2).join(' | ')}` : ''}`)
  await ctx.close()
}

const desktop = { width: 1280, height: 800 }
const phone = { width: 390, height: 844 }
const wide = { width: 1920, height: 1080 }
await shoot('d-login', '/login', { ...desktop, signedIn: false, full: false })
await shoot('xl-login', '/login', { ...wide, signedIn: false, full: false })
await shoot('xl-signup', '/signup', { ...wide, signedIn: false, full: false })
await shoot('xl-home', '/', { ...wide, full: false })
await shoot('m-login', '/login', { ...phone, signedIn: false })
await shoot('m-signup', '/signup', { ...phone, signedIn: false })
for (const [slug, path, settle] of [['home', '/', 900], ['accounts', '/accounts', 900], ['ledger', '/ledger', 900], ['capture', '/capture', 900], ['goals', '/goals', 900], ['insights', '/insights', 2200], ['recurring', '/recurring', 900], ['freedom', '/freedom', 2200], ['profile', '/profile', 900]]) {
  await shoot(`d-${slug}`, path, { ...desktop, settle })
}
for (const [slug, path, settle] of [['home', '/', 900], ['accounts', '/accounts', 900], ['capture', '/capture', 900], ['insights', '/insights', 2200], ['freedom', '/freedom', 2200]]) {
  await shoot(`m-${slug}`, path, { ...phone, settle })
}
await shoot('m-more-menu', '/', { ...phone, full: false, action: async (p) => { await p.getByRole('button', { name: 'More' }).click(); await p.waitForTimeout(300) } })
await shoot('d-collapsed', '/', { ...desktop, full: false, action: async (p) => { await p.getByRole('button', { name: 'Collapse sidebar' }).click(); await p.waitForTimeout(300); await p.getByRole('link', { name: 'Accounts' }).first().hover(); await p.waitForTimeout(200) } })
await shoot('d-hover', '/accounts', { ...desktop, full: false, action: async (p) => { await p.getByRole('link', { name: 'Entries' }).first().hover(); await p.waitForTimeout(250) } })
await shoot('d-usermenu', '/', { ...desktop, full: false, action: async (p) => { await p.getByRole('button', { name: /Account menu/ }).click(); await p.waitForTimeout(200) } })
await shoot('d-search', '/', { ...desktop, full: false, action: async (p) => { await p.getByPlaceholder('Search pages').fill('re'); await p.waitForTimeout(200) } })
for (const [slug, path] of [['home', '/'], ['accounts', '/accounts'], ['ledger', '/ledger'], ['capture', '/capture'], ['goals', '/goals'], ['recurring', '/recurring'], ['insights', '/insights']]) {
  await shoot(`e-${slug}`, path, { ...desktop, empty: true, settle: 1200 })
}
await shoot('m-e-accounts', '/accounts', { ...phone, empty: true })
await shoot('d-dropdown', '/accounts', { ...desktop, full: false, action: async (p) => { await p.getByRole('button', { name: 'Add account' }).first().click(); await p.getByLabel('Type').click(); await p.waitForTimeout(400) } })
await shoot('d-add-account', '/accounts', { ...desktop, action: async (p) => { await p.getByRole('button', { name: 'Add account' }).click(); await p.waitForTimeout(300) } })

await browser.close()
process.kill(-vite.pid)
proxy.close()
console.log('screenshots saved')
process.exit(0)
