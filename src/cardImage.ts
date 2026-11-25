// Draws the Curly ID Card as a picture (1080 x 1350, a phone-friendly portrait)
// and hands it to the phone's share sheet, or downloads it where sharing files
// isn't possible. Nothing is uploaded.
import type { CardRow } from './engine/card'

const C = {
  orange: '#E86326',
  tangerine: '#F18B25',
  coral: '#E44B52',
  mustard: '#E3A441',
  cream: '#F7D192',
  creamLight: '#FFF3DD',
  cocoa: '#5A2A1E',
  teal: '#2AA08B',
}

const SANS = '"Montserrat Variable", Montserrat, sans-serif'
const SERIF = '"Playfair Display", Georgia, serif'
const SCRIPT = 'Yellowtail, cursive'

export async function drawCard(rows: CardRow[]): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load(`900 80px ${SANS}`),
    document.fonts.load(`600 40px ${SERIF}`),
    document.fonts.load(`60px ${SCRIPT}`),
  ]).catch(() => undefined)

  const W = 1080
  const H = 1350
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const g = cv.getContext('2d')
  if (!g) throw new Error('no canvas')

  // Background: orange, a teal floor band, curls in the corner.
  g.fillStyle = C.orange
  g.fillRect(0, 0, W, H)
  g.fillStyle = C.teal
  g.fillRect(0, H - 170, W, 170)
  g.strokeStyle = C.mustard
  g.lineWidth = 8
  g.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    g.beginPath()
    for (let t = 0; t <= 60; t++) {
      const y = 40 + t * 5
      const x = 80 + i * 46 + Math.sin(t / 4 + i) * (10 + i * 2)
      if (t === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }

  // Title.
  g.fillStyle = C.creamLight
  g.textAlign = 'center'
  g.font = `600 64px ${SERIF}`
  g.fillText('Hey beautiful, Love the', W / 2 + 40, 175)
  g.font = `110px ${SCRIPT}`
  g.fillText('Curls', W / 2 + 150, 290)

  // The card.
  const x = 70
  const y = 360
  const w = W - 140
  const h = 760
  const r = 40
  const mark = Math.round(w * 0.38)
  g.fillStyle = C.cocoa
  roundRect(g, x + 12, y + 14, w, h, r)
  g.fill()
  g.save()
  roundRect(g, x, y, w, h, r)
  g.clip()
  g.fillStyle = C.cream
  g.fillRect(x, y, w, h)
  // Diagonal coral and tangerine block.
  g.fillStyle = C.tangerine
  g.fillRect(x, y, mark, h)
  g.fillStyle = C.coral
  g.beginPath()
  g.moveTo(x, y)
  g.lineTo(x + mark, y)
  g.lineTo(x, y + mark * 1.6)
  g.closePath()
  g.fill()
  g.restore()
  g.strokeStyle = C.cocoa
  g.lineWidth = 8
  roundRect(g, x, y, w, h, r)
  g.stroke()

  // "Curly ID Card" in chunky outlined letters.
  g.font = `900 92px ${SANS}`
  g.textAlign = 'center'
  g.lineJoin = 'round'
  ;['Curly', 'ID', 'Card'].forEach((word, i) => {
    const cx = x + mark / 2
    const cy = y + h / 2 - 120 + i * 130
    g.fillStyle = C.cocoa
    g.fillText(word, cx + 6, cy + 6)
    g.lineWidth = 10
    g.strokeStyle = C.cocoa
    g.strokeText(word, cx, cy)
    g.fillStyle = C.mustard
    g.fillText(word, cx, cy)
  })

  // Rows.
  const rx = x + mark + 36
  const rw = w - mark - 72
  const step = Math.min(110, (h - 120) / rows.length)
  rows.forEach((row, i) => {
    const ry = y + 70 + i * step + step / 2
    g.textAlign = 'left'
    g.fillStyle = C.cocoa
    g.font = `500 40px ${SANS}`
    g.fillText(row.label, rx, ry)
    g.textAlign = 'right'
    g.font = `800 44px ${SANS}`
    if (g.measureText(row.value).width <= rw * 0.55) g.fillText(row.value, rx + rw, ry)
    else {
      // A long value (several heritages) goes on its own line under the label.
      g.font = `800 36px ${SANS}`
      g.fillText(fit(g, row.value, rw), rx + rw, ry + 42)
    }
    if (i < rows.length - 1) {
      g.strokeStyle = 'rgba(90,42,30,0.25)'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(rx, ry + step / 2 - 6)
      g.lineTo(rx + rw, ry + step / 2 - 6)
      g.stroke()
    }
  })

  // Footer.
  g.textAlign = 'center'
  g.fillStyle = C.creamLight
  g.font = `700 40px ${SANS}`
  g.fillText('CURLY GIRL SANCTUARY', W / 2, H - 70)
  return cv
}

function fit(g: CanvasRenderingContext2D, text: string, max: number): string {
  if (g.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && g.measureText(t + '…').width > max) t = t.slice(0, -1)
  return t + '…'
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** Share on a phone; download elsewhere. Returns what happened. */
export async function shareCard(rows: CardRow[]): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const cv = await drawCard(rows)
  const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/png'))
  if (!blob) throw new Error('no image')
  const file = new File([blob], 'my-curly-id-card.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'My Curly ID Card' })
      return 'shared'
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'downloaded'
}
