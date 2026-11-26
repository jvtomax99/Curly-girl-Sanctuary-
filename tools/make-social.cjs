// Renders tools/social-card.html into public/social.jpg, the picture shown when the app's link is
// shared (index.html's og:image). Needs Playwright and npm install. Run from the repo root.
const { chromium } = require('playwright')
const path = require('node:path')

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.goto('file://' + path.resolve(__dirname, 'social-card.html'))
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  await p.screenshot({ path: path.resolve(__dirname, '../public/social.jpg'), type: 'jpeg', quality: 86 })
  await b.close()
  console.log('public/social.jpg')
})()
