// Walks the member screens (Phase 2) with made-up people against the stand-in server
// in tools/fake-supabase.cjs, takes screenshots and prints any problem.
// 1. Build with the fake project: VITE_SUPABASE_URL=https://cgs-fake.supabase.co
//    VITE_SUPABASE_KEY=fake npx vite build --outDir <folder>/Curly-girl-Sanctuary-
// 2. Serve <folder>: python3 -m http.server 8131
// 3. node tools/member-shots.cjs [base-url] [out-folder] [scale]
const { chromium } = require('playwright')
const fs = require('node:fs')
const { fake, useFake } = require('./fake-supabase.cjs')

const BASE = process.argv[2] || 'http://localhost:8131/Curly-girl-Sanctuary-/'
const OUT = process.argv[3] || 'shots-members'
const SCALE = Number(process.argv[4] || 1)
fs.mkdirSync(OUT, { recursive: true })
const problems = []
const check = (ok, what) => ok || problems.push(what)
let stage = 'start'
let lastPage = null

// A finished quiz on the phone (made-up answers), heritage switch on.
const QUIZ = JSON.stringify({
  v: 1, step: 9, done: true, seenOpening: true, showHeritage: true, traditionsNote: '',
  answers: { pattern: ['4A'], porosity: ['high'], thickness: ['coarse'], density: ['high'], heritage: ['caribbean', 'mixed'], wash: ['weekly'], scalp: ['dry'], struggle: ['dryness'], goal: ['moisture'], traditions: ['all'] },
})

async function run(width, height, tag, server) {
  const browser = await chromium.launch()
  const open = async (name) => {
    // Requests through the offline worker would skip the stand-in server; offline is checked by tools/shots.cjs.
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: SCALE, serviceWorkers: 'block' })
    await useFake(ctx, server)
    const page = await ctx.newPage()
    lastPage = page
    page.on('console', (m) => m.type() === 'error' && !/40[0-9]|Failed to load resource/.test(m.text()) && problems.push(`${tag} ${name} console: ${m.text()}`))
    page.on('pageerror', (e) => problems.push(`${tag} ${name} page error: ${e.message}`))
    return page
  }
  const shot = (page, name) => page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: true })
  const noSideScroll = async (page, where) => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(w <= 0, `${tag} ${where}: scrolls sideways by ${w}px`)
  }
  // Taps something after scrolling it to the middle, clear of the fixed bottom bar.
  const tap = async (loc) => {
    await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await loc.click()
  }
  const join = async (page, who) => {
    await page.goto(BASE + '#/join')
    await page.getByLabel('First name').fill(who.first)
    await page.getByLabel('Last name').fill('Madeup')
    await page.getByLabel('Email').fill(who.email)
    await page.getByLabel('Curly username').fill(who.username)
    await page.getByLabel('Password').fill('made-up-pass-1')
    await page.getByLabel(/or older/).check()
    await page.getByLabel(/community guidelines/).check()
  }

  // ---- A: quiz done on the phone, preview on, joins
  stage = 'A: quiz done on the phone, preview on, joins'
  const a = await open('A')
  await a.goto(BASE)
  await a.evaluate((q) => localStorage.setItem('cgs.quiz.v1', q), QUIZ)
  await a.goto(BASE + '#/preview')
  await a.reload()
  await a.getByRole('button', { name: 'Join the Sanctuary' }).waitFor()
  check(await a.getByText('Testing only').isVisible(), `${tag}: preview banner missing`)
  check(await a.getByRole('button', { name: 'Already a member? Log in' }).isVisible(), `${tag}: card has no Log in link in preview`)
  await shot(a, '01-card-preview')
  await a.getByRole('button', { name: 'Join the Sanctuary' }).click()
  await a.getByRole('heading', { name: 'Join the Sanctuary' }).waitFor()
  await a.getByRole('button', { name: 'Join', exact: true }).click()
  check((await a.getByRole('alert').first().textContent())?.includes('first and last name'), `${tag}: empty form not caught`)
  await join(a, { first: 'Ana', email: 'ana@example.test', username: '@Coily.Ana' })
  await shot(a, '02-join')
  await noSideScroll(a, 'join')
  await a.getByRole('button', { name: 'Join', exact: true }).click()
  await a.getByRole('heading', { name: '@coily.ana' }).waitFor()
  check(await a.getByText('Your Curly ID is saved').isVisible(), `${tag}: no welcome after joining`)
  check(await a.getByText('it starts as Only me here').isVisible(), `${tag}: heritage switch prompt missing`)
  const heritage = a.getByRole('group', { name: 'Who sees your heritage?' })
  check(await heritage.getByLabel('Only me').isChecked(), `${tag}: heritage did not start as Only me`)
  await shot(a, '03-profile-new')
  await noSideScroll(a, 'profile')

  // A shares: card with Everyone, heritage with Community, scalp stays Community.
  await tap(a.getByRole('group', { name: 'Who sees your Curly ID Card?' }).getByRole('radio', { name: 'Everyone' }))
  await tap(heritage.getByRole('radio', { name: 'Community' }))
  await a.waitForTimeout(200)
  await tap(a.getByRole('button', { name: 'Everyone', exact: true }))
  await a.getByText('exactly what the server shows').waitFor()
  check(await a.getByRole('heading', { name: 'Curly ID Card' }).isVisible(), `${tag}: see-as Everyone lost the card`)
  check((await a.getByText('Hidden').count()) === 2, `${tag}: see-as Everyone should hide scalp and heritage`)
  await shot(a, '04-see-as-everyone')
  await tap(a.getByRole('button', { name: 'Me', exact: true }))

  // ---- B: another member
  stage = 'B: another member'
  const b = await open('B')
  await b.goto(BASE + '#/preview')
  await b.waitForTimeout(200)
  await join(b, { first: 'Bea', email: 'bea@example.test', username: 'coily.ana' })
  await b.getByLabel('Password').click() // leaves the username box: availability check
  check(await b.getByText('That one’s taken').isVisible(), `${tag}: taken username not flagged`)
  await b.getByLabel('Curly username').fill('wavy_bea')
  await b.getByRole('button', { name: 'Join', exact: true }).click()
  await b.getByRole('heading', { name: '@wavy_bea' }).waitFor()
  await b.goto(BASE + '#/u/coily.ana')
  await b.getByRole('heading', { name: '@coily.ana' }).waitFor()
  await b.getByRole('heading', { name: 'Heritage' }).waitFor()
  check(await b.getByText('Caribbean, Mixed').isVisible(), `${tag}: member B can't see Community heritage`)
  await shot(b, '05-member-view')

  // ---- A visitor, not logged in
  stage = 'A visitor, not logged in'
  const v = await open('visitor')
  await v.goto(BASE + '#/u/coily.ana')
  await v.getByRole('heading', { name: '@coily.ana' }).waitFor()
  await v.getByRole('heading', { name: 'Curly ID Card' }).waitFor()
  check(!(await v.getByRole('heading', { name: 'Heritage' }).isVisible()), `${tag}: visitor sees Community heritage`)
  check(!(await v.getByRole('heading', { name: 'Scalp type' }).isVisible()), `${tag}: visitor sees Community scalp`)
  await shot(v, '06-visitor-view')

  // ---- A: settings, then delete the account
  stage = 'A: settings, then delete the account'
  await a.getByRole('link', { name: 'Profile' }).waitFor()
  await tap(a.getByRole('button', { name: 'Settings' }))
  await a.getByRole('heading', { name: 'Settings' }).waitFor()
  await shot(a, '07-settings')
  await noSideScroll(a, 'settings')
  await a.getByLabel(/to confirm/).fill('wrong')
  await tap(a.getByRole('button', { name: 'Delete my account' }))
  check(await a.getByRole('alert').filter({ hasText: 'Type coily.ana to confirm' }).isVisible(), `${tag}: delete without the right username not stopped`)
  await a.getByLabel(/to confirm/).fill('coily.ana')
  await tap(a.getByRole('button', { name: 'Delete my account' }))
  await a.getByRole('heading', { name: 'Your Curly ID' }).waitFor()
  check(!server.db.profiles.some((p) => p.username === 'coily.ana') && !server.db.profile_items.some((i) => !server.db.profiles.some((p) => p.id === i.member)),
    `${tag}: account data left after delete`)
  await v.reload()
  await v.getByRole('heading', { name: 'Not found' }).waitFor()
  await shot(v, '08-after-delete')

  // ---- Log in, wrong then right (B)
  stage = 'Log in, wrong then right (B)'
  const b2 = await open('B again')
  await b2.goto(BASE + '#/login')
  await b2.getByLabel('Email').fill('bea@example.test')
  await b2.getByLabel('Password').fill('nope-nope')
  await b2.getByRole('button', { name: 'Log in' }).click()
  await b2.getByText('don’t match').waitFor()
  await shot(b2, '09-login-error')
  await b2.getByLabel('Password').fill('made-up-pass-1')
  await b2.getByRole('button', { name: 'Log in' }).click()
  await b2.getByRole('heading', { name: '@wavy_bea' }).waitFor()

  // ---- Without preview, the live app keeps "Join" on the coming-soon page
  stage = 'Without preview, the live app keeps "Join" on the coming-soon page'
  const c = await open('closed')
  await c.goto(BASE)
  await c.evaluate((q) => localStorage.setItem('cgs.quiz.v1', q), QUIZ)
  await c.goto(BASE + '#/card')
  await c.reload()
  await c.getByRole('button', { name: 'Join the Sanctuary' }).click()
  await c.getByText('opens').first().waitFor()
  check(!(await c.getByText('Testing only').isVisible()), `${tag}: preview banner shows without preview`)
  check(!(await c.getByRole('button', { name: 'Already a member? Log in' }).isVisible()), `${tag}: Log in shows before sign-ups open`)

  await browser.close()
}

;(async () => {
  try {
    await run(390, 844, 'phone', fake())
    await run(1440, 900, 'desktop', fake())
  } catch (e) {
    problems.push(`stopped at "${stage}": ${e.message.split('\n').slice(0, 8).join(' | ')}`)
    await lastPage?.screenshot({ path: `${OUT}/stopped.png`, fullPage: true }).catch(() => {})
  }
  if (problems.length) {
    console.log('Problems:\n- ' + problems.join('\n- '))
    process.exit(1)
  }
  console.log(`Member walk-through passed. Screenshots in ${OUT}/`)
})()
