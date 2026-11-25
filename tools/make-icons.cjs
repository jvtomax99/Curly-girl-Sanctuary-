// Draws the app icons from public/icon.svg (run by hand after changing it):
// node tools/make-icons.cjs (needs Playwright, already in cloud sessions)
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')

;(async () => {
const svg = readFileSync('public/icon.svg', 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, size, pad] of [
  ['public/icon-192.png', 192, 0],
  ['public/icon-512.png', 512, 0],
  ['public/apple-touch-icon.png', 180, 0],
  ['public/icon-maskable-512.png', 512, 0.1],
]) {
  await page.setViewportSize({ width: size, height: size })
  const inner = Math.round(size * (1 - pad * 2))
  await page.setContent(`<body style="margin:0;background:#E86326;display:grid;place-items:center;height:100vh">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body>`)
  await page.screenshot({ path: file })
}
await browser.close()
console.log('icons written')
})()
