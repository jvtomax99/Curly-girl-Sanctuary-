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

  // ---- A: Curl Kit (Phase 2b)
  stage = 'A: Curl Kit'
  const kitOf = (who) => server.db.profiles.find((p) => p.username === who).id
  const search = async (page, q) => {
    const box = page.getByLabel(/Add a product|Find the/).first()
    await box.fill(q)
    await page.getByText(/\d+ match/).first().waitFor()
  }
  const suggestion = (page, re) => page.getByRole('button', { name: re })
  await tap(a.getByRole('button', { name: 'Start my Curl Kit' }))
  await a.getByRole('heading', { name: 'My Curl Kit' }).waitFor()
  check(await a.getByRole('group', { name: 'Who sees your Curl Kit?' }).getByLabel('Everyone').isChecked(), `${tag}: kit doesn't start as Everyone`)
  await search(a, 'hyd')
  check((await a.locator('.psearch-item').count()) === 4, `${tag}: "hyd" should suggest the four made-up hydrating products`)
  check(await suggestion(a, /^Hydra Curl Cream .*New$/).isVisible(), `${tag}: suggestion without a member count`)
  await shot(a, '05-kit-suggestions')
  await tap(suggestion(a, /^Hydra Curl Cream/))
  await a.getByText('Added Hydra Curl Cream.').waitFor()
  await search(a, 'hydrating leave')
  await tap(suggestion(a, /^Hydrating Leave In /))
  await a.getByText('Added Hydrating Leave In.').waitFor()
  await search(a, 'hyd')
  check(await suggestion(a, /^Hydra Curl Cream .*In your kit$/).isDisabled(), `${tag}: a product already in the kit can be added twice`)
  // Add your own: a new one (waits for a moderator), then one that's already listed.
  const addOwn = async (brand, name, kind) => {
    if (await a.getByRole('button', { name: 'Can’t find it? Add your own' }).isVisible()) await tap(a.getByRole('button', { name: 'Can’t find it? Add your own' }))
    await a.getByLabel('Brand').fill(brand)
    await a.getByLabel('Product name').fill(name)
    await a.getByLabel('Type').selectOption(kind)
    await tap(a.getByRole('button', { name: 'Add to my kit' }))
  }
  await tap(a.getByRole('button', { name: 'Can’t find it? Add your own' }))
  await tap(a.getByRole('button', { name: 'Add to my kit' }))
  check(await a.getByRole('alert').filter({ hasText: 'Add the brand.' }).isVisible(), `${tag}: empty Add your own not caught`)
  await addOwn('Kitchen Test', 'Flax Gel', 'gel')
  await a.getByText('Added Flax Gel. Only you see it').waitFor()
  check(await a.locator('.kit-pending').first().isVisible(), `${tag}: a new product isn't marked as waiting for a moderator`)
  await addOwn('pretend naturals', 'shea curl-butter', 'butter')
  await a.getByText('was already listed').waitFor()
  check(server.db.products.filter((p) => /shea curl/i.test(p.name)).length === 1, `${tag}: Add your own made a duplicate of a listed product`)
  await addOwn('Kitchen Test', 'Glitter Paste', 'other')
  await a.getByText('Added Glitter Paste.').waitFor()
  await tap(a.getByRole('button', { name: 'Diffuser' }))
  await tap(a.getByRole('button', { name: 'Satin or silk bonnet' }))
  await tap(a.getByRole('button', { name: 'Diffuse', exact: true }))
  await a.waitForTimeout(300)
  const aid = kitOf('coily.ana')
  check(server.db.kit_products.filter((k) => k.member === aid).length === 5, `${tag}: kit should hold five products`)
  check(server.db.kit_tools.filter((k) => k.member === aid).length === 2, `${tag}: kit should hold two tools`)
  check(server.db.profile_items.find((i) => i.member === aid && i.item === 'kit')?.value?.dry === 'diffuse', `${tag}: how I dry not saved`)
  check(await a.getByRole('button', { name: 'Diffuse', exact: true }).getAttribute('aria-pressed') === 'true', `${tag}: Diffuse not shown as picked`)
  await shot(a, '06-kit-edit')
  await noSideScroll(a, 'kit')
  await tap(a.getByRole('button', { name: 'Back to my profile' }))
  await a.getByRole('heading', { name: '@coily.ana' }).waitFor()
  await a.getByText('Flax Gel').waitFor()
  check(await a.getByRole('button', { name: 'Edit my Curl Kit' }).isVisible(), `${tag}: profile doesn't offer Edit my Curl Kit`)
  await tap(a.getByRole('button', { name: 'Community', exact: true }))
  check(!(await a.getByText('Flax Gel').isVisible()), `${tag}: see-as Community shows a product waiting for a moderator`)
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
  await shot(b, '07-member-view')

  // B opens A's shared kit link: the waiting products stay hidden.
  stage = 'B: A\'s shared kit, and the moderator page'
  await tap(b.getByRole('button', { name: 'See @coily.ana’s Curl Kit' }))
  await b.getByRole('heading', { name: '@coily.ana’s Curl Kit' }).waitFor()
  await b.getByText('Hydra Curl Cream').waitFor()
  check(!(await b.getByText('Flax Gel').isVisible()) && !(await b.getByText('Glitter Paste').isVisible()), `${tag}: another member sees products waiting for a moderator`)
  check(await b.getByText('Satin or silk bonnet').isVisible() && await b.getByText('Diffuse', { exact: true }).isVisible(), `${tag}: shared kit lost tools or how I dry`)
  await shot(b, '08-shared-kit')
  await b.goto(BASE + '#/kit')
  await b.getByRole('heading', { name: 'My Curl Kit' }).waitFor()
  await search(b, 'hyd')
  check(await suggestion(b, /^Hydra Curl Cream .*1 member$/).isVisible(), `${tag}: member count missing after A added the cream`)

  // Not a moderator yet: the page says so (the server would refuse anyway).
  await b.goto(BASE + '#/admin/products')
  await b.getByText('for the Sanctuary’s moderators').waitFor()
  server.db.staff.push({ member: kitOf('wavy_bea'), role: 'moderator' })
  await b.goto(BASE + '#/profile')
  await tap(b.getByRole('button', { name: 'Moderate products' }))
  await b.getByRole('heading', { name: 'Waiting for a check (2)' }).waitFor()
  await shot(b, '09-admin')
  await noSideScroll(b, 'admin')
  check(!(await b.getByText('coily.ana').isVisible()), `${tag}: moderator page shows who added a product`)
  await tap(b.getByRole('button', { name: 'Approve Flax Gel' }))
  await b.getByText('Approved Flax Gel').waitFor()
  await tap(b.getByRole('button', { name: 'Turn down Glitter Paste' }))
  await tap(b.getByRole('button', { name: 'Yes, turn it down' }))
  await b.getByText('Turned down Glitter Paste').waitFor()
  await b.getByRole('heading', { name: 'Waiting for a check (0)' }).waitFor()
  check(!server.db.kit_products.some((k) => k.member === aid && server.db.products.every((p) => p.id !== k.product_id)), `${tag}: turned-down product left in a kit`)
  // Merge the duplicate leave-in into the one to keep.
  await search(b, 'hydrating leave')
  await tap(suggestion(b, /^Hydrating Leave In /))
  await search(b, 'hydrating leave')
  check(await suggestion(b, /^Hydrating Leave In .*The duplicate$/).isDisabled(), `${tag}: the duplicate can be picked as the one to keep`)
  await tap(suggestion(b, /^Hydrating Leave-In /))
  await tap(b.getByRole('button', { name: 'Merge', exact: true }))
  await shot(b, '10-admin-merge')
  await tap(b.getByRole('button', { name: 'Yes, merge' }))
  await b.getByText('Merged. Every kit with').waitFor()
  const keptId = server.db.products.find((p) => p.name === 'Hydrating Leave-In').id
  const dupId = server.db.products.find((p) => p.name === 'Hydrating Leave In').id
  check(server.db.kit_products.some((k) => k.member === aid && k.product_id === keptId) && !server.db.kit_products.some((k) => k.product_id === dupId),
    `${tag}: merging didn't move A's kit to the kept product`)

  // ---- A visitor, not logged in
  stage = 'A visitor, not logged in'
  const v = await open('visitor')
  await v.goto(BASE + '#/u/coily.ana')
  await v.getByRole('heading', { name: '@coily.ana' }).waitFor()
  await v.getByRole('heading', { name: 'Curly ID Card' }).waitFor()
  check(!(await v.getByRole('heading', { name: 'Heritage' }).isVisible()), `${tag}: visitor sees Community heritage`)
  check(!(await v.getByRole('heading', { name: 'Scalp type' }).isVisible()), `${tag}: visitor sees Community scalp`)
  await shot(v, '11-visitor-view')
  await v.goto(BASE + '#/u/coily.ana/kit')
  await v.getByText('Hydrating Leave-In').waitFor()
  check(await v.getByText('Flax Gel').isVisible(), `${tag}: an approved product missing from the shared kit`)
  check(!(await v.getByText('Only you see this').isVisible()), `${tag}: visitor sees a waiting label`)
  await shot(v, '12-visitor-kit')
  // A sets the kit to Community: the visitor's link stops showing it.
  await a.goto(BASE + '#/kit')
  await tap(a.getByRole('group', { name: 'Who sees your Curl Kit?' }).getByRole('radio', { name: 'Community' }))
  await a.waitForTimeout(300)
  await v.reload()
  await v.getByText('keeps their Curl Kit to members').waitFor()
  check(!(await v.getByText('Hydra Curl Cream').isVisible()), `${tag}: a Community kit shows to a visitor`)
  await a.goto(BASE + '#/profile')
  await a.getByRole('heading', { name: '@coily.ana' }).waitFor()

  // ---- A: settings, then delete the account
  stage = 'A: settings, then delete the account'
  await a.getByRole('link', { name: 'Profile' }).waitFor()
  await tap(a.getByRole('button', { name: 'Settings' }))
  await a.getByRole('heading', { name: 'Settings' }).waitFor()
  await shot(a, '13-settings')
  await noSideScroll(a, 'settings')
  await a.getByLabel(/to confirm/).fill('wrong')
  await tap(a.getByRole('button', { name: 'Delete my account' }))
  check(await a.getByRole('alert').filter({ hasText: 'Type coily.ana to confirm' }).isVisible(), `${tag}: delete without the right username not stopped`)
  await a.getByLabel(/to confirm/).fill('coily.ana')
  await tap(a.getByRole('button', { name: 'Delete my account' }))
  await a.getByRole('heading', { name: 'Your Curly ID' }).waitFor()
  check(!server.db.profiles.some((p) => p.username === 'coily.ana') && !server.db.profile_items.some((i) => !server.db.profiles.some((p) => p.id === i.member)),
    `${tag}: account data left after delete`)
  check(!server.db.kit_products.some((k) => k.member === aid) && !server.db.kit_tools.some((k) => k.member === aid), `${tag}: kit left after delete`)
  await v.reload()
  await v.getByRole('heading', { name: 'Not found' }).waitFor()
  await shot(v, '14-after-delete')

  // ---- Log in, wrong then right (B)
  stage = 'Log in, wrong then right (B)'
  const b2 = await open('B again')
  // A returning member on a new phone: the opening offers Log in (preview on).
  await b2.goto(BASE + '#/preview')
  await b2.reload()
  await tap(b2.getByRole('button', { name: 'Already a member? Log in' }))
  await b2.getByRole('heading', { name: 'Welcome back' }).waitFor()
  await b2.getByLabel('Email').fill('bea@example.test')
  await b2.getByLabel('Password').fill('nope-nope')
  await b2.getByRole('button', { name: 'Log in' }).click()
  await b2.getByText('don’t match').waitFor()
  await shot(b2, '15-login-error')
  await b2.getByLabel('Password').fill('made-up-pass-1')
  await b2.getByRole('button', { name: 'Log in' }).click()
  await b2.getByRole('heading', { name: '@wavy_bea' }).waitFor()
  await tap(b2.getByRole('button', { name: 'Settings' }))
  await tap(b2.getByRole('button', { name: 'Log out' }))
  await b2.getByRole('button', { name: 'Start the quiz' }).waitFor()
  await b2.goBack()
  await b2.waitForTimeout(300)
  check(!(await b2.getByRole('heading', { name: 'Settings' }).isVisible()), `${tag}: Back after log out reopens Settings`)

  // ---- Without preview, the live app keeps "Join" on the coming-soon page
  stage = 'Without preview, the live app keeps "Join" on the coming-soon page'
  const c = await open('closed')
  await c.addInitScript((q) => localStorage.setItem('cgs.quiz.v1', q), QUIZ)
  await c.goto(BASE + '#/card')
  await c.getByRole('button', { name: 'Join the Sanctuary' }).click()
  await c.getByText('opens').first().waitFor()
  check(!(await c.getByText('Testing only').isVisible()), `${tag}: preview banner shows without preview`)
  check(!(await c.getByRole('button', { name: 'Already a member? Log in' }).isVisible()), `${tag}: Log in shows before sign-ups open`)
  const d = await open('closed opening')
  await d.goto(BASE)
  await d.getByRole('button', { name: 'Skip' }).click()
  await d.getByRole('button', { name: 'Start the quiz' }).waitFor()
  check(!(await d.getByRole('button', { name: 'Already a member? Log in' }).isVisible()), `${tag}: opening shows Log in before sign-ups open`)

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
