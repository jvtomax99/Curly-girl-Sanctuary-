// Walks the built app with made-up answers and takes screenshots (phone first).
// Serve dist/ as /Curly-girl-Sanctuary-/ first (see CLAUDE.md, Commands), then:
// node tools/shots.cjs [base-url] [out-folder] [scale]
const { chromium } = require('playwright')
const fs = require('node:fs')

const BASE = process.argv[2] || 'http://localhost:8130/Curly-girl-Sanctuary-/'
const OUT = process.argv[3] || 'shots'
const SCALE = Number(process.argv[4] || 1)
fs.mkdirSync(OUT, { recursive: true })
const problems = []

async function run(width, height, tag) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: SCALE })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && problems.push(`${tag} console: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`${tag} page error: ${e.message}`))
  const shot = (name) => page.screenshot({ path: `${OUT}/${tag}-${name}.png` })
  const noSideScroll = async (where) => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (w > 0) problems.push(`${tag} ${where}: scrolls sideways by ${w}px`)
  }

  await page.goto(BASE)
  for (const [name, ms] of [['open-1-video', 800], ['open-2-black', 3400], ['open-3-pink', 5600], ['open-4-words', 8200], ['open-5-start', 10200]]) {
    await page.waitForTimeout(ms - (await page.evaluate(() => performance.now())))
    await shot(name)
  }
  await page.getByRole('button', { name: 'Start the quiz' }).click()

  const next = () => page.getByRole('button', { name: /^(Next|See my Curly ID)$/ }).click()
  await page.getByRole('button', { name: 'Curl type 3B' }).click()
  await page.waitForTimeout(300)
  await shot('q01-pattern'); await noSideScroll('q1')
  await next()
  await page.getByRole('button', { name: /^Medium/ }).click(); await shot('q02-porosity'); await next()
  await page.getByRole('button', { name: /^Fine/ }).click(); await next()
  // Reload in the middle: the quiz should come back at question 4.
  await page.reload()
  const count = await page.locator('.quiz-count').innerText()
  if (!count.startsWith('4 of')) problems.push(`${tag} reload mid-quiz landed on "${count}", not question 4`)
  await page.getByRole('button', { name: /^A little/ }).click(); await next()
  await page.getByRole('button', { name: 'Mixed' }).click()
  await page.getByRole('button', { name: 'Caribbean' }).click()
  await page.getByRole('switch').click()
  await page.waitForTimeout(300)
  await shot('q05-heritage'); await noSideScroll('q5')
  await next()
  for (const label of ['2 to 3 times a week', 'Balanced', 'Frizz', 'Moisture']) {
    await page.getByRole('button', { name: new RegExp('^' + label) }).click(); await next()
  }
  await shot('q10-traditions'); await next()
  await page.waitForSelector('.idcard')
  await shot('card'); await noSideScroll('card')
  const rows = await page.locator('.idcard-rows div').allInnerTexts()
  if (!rows.some((r) => r.includes('Heritage'))) problems.push(`${tag} card: heritage missing with the switch on`)
  // The card as a picture (no share sheet here, so it downloads).
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save or share my card' }).click()])
  await dl.saveAs(`${OUT}/${tag}-card-picture.png`)
  await page.getByRole('button', { name: 'Join the Sanctuary' }).click()
  await page.waitForSelector('.soon'); await shot('soon')
  await page.getByRole('button', { name: 'Back to my card' }).click()
  await page.waitForSelector('.idcard')
  await page.getByRole('button', { name: 'No thanks, just the quiz' }).click()
  await page.waitForSelector('.tips')
  await shot('tips'); await page.screenshot({ path: `${OUT}/${tag}-tips-full.png`, fullPage: true })
  await noSideScroll('tips')

  // Tap targets: every button at least 44 px tall (links inside sentences are exempt).
  const small = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => [b.textContent.trim().slice(0, 30), b.getBoundingClientRect().height]).filter(([, h]) => h > 0 && h < 44))
  if (small.length && tag === 'phone') problems.push(`${tag} small tap targets on tips: ${JSON.stringify(small.slice(0, 5))}`)

  // Offline: after this visit, the app opens with no connection.
  await page.waitForTimeout(1500)
  await ctx.setOffline(true)
  await page.goto(BASE + '#/card').catch(() => undefined)
  if (!(await page.locator('.idcard').count())) problems.push(`${tag} offline: the app did not open`)
  await ctx.setOffline(false)
  await browser.close()
}

async function reducedMotion() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.waitForFunction(() => document.querySelector('.opening')?.dataset.stage === 'words', null, { timeout: 15000 })
  const moved = await page.evaluate(() => [...document.querySelectorAll('.op-line')].map((el) => getComputedStyle(el).transform))
  await page.waitForTimeout(400)
  const later = await page.evaluate(() => [...document.querySelectorAll('.op-line')].map((el) => getComputedStyle(el).transform))
  if ([...moved, ...later].some((t) => t !== 'none')) problems.push(`reduce motion: the words slide (${moved.join(' | ')})`)
  // Skip reaches the button at once.
  await page.reload()
  await page.getByRole('button', { name: 'Skip' }).click()
  await page.getByRole('button', { name: 'Start the quiz' }).click({ timeout: 2000 })
  await page.waitForSelector('.q-title')
  await browser.close()
}

;(async () => {
  await run(390, 844, 'phone')
  await run(1440, 900, 'desktop')
  await reducedMotion()
  console.log(problems.length ? problems.join('\n') : 'no problems found')
})()
