// A curl drawn in code for each type, 2A (loose wave) to 4C (tight coil).
// Stand-in art until Susan's illustration files arrive.
import type { CurlType } from '../data/quiz'

// r: loop size, k: how far each turn travels down, turns: how many turns.
const SHAPES: Record<CurlType, { r: number; k: number; turns: number; zigzag?: boolean }> = {
  '2A': { r: 5, k: 9, turns: 2 },
  '2B': { r: 7, k: 8, turns: 2.5 },
  '2C': { r: 9, k: 8.5, turns: 3 },
  '3A': { r: 11, k: 7, turns: 3 },
  '3B': { r: 10, k: 5, turns: 4 },
  '3C': { r: 9, k: 3.8, turns: 5 },
  '4A': { r: 8, k: 2.8, turns: 6 },
  '4B': { r: 9, k: 0, turns: 9, zigzag: true },
  '4C': { r: 6, k: 1.6, turns: 9 },
}

export function curlPath(type: CurlType, height = 100): string {
  const { r, k, turns, zigzag } = SHAPES[type]
  const top = 6
  const usable = height - 12
  if (zigzag) {
    const step = usable / (turns * 2)
    const pts = Array.from({ length: turns * 2 + 1 }, (_, i) => `${i === 0 ? 'M' : 'L'}${(30 + (i % 2 ? r : -r)).toFixed(1)} ${(top + i * step).toFixed(1)}`)
    return pts.join(' ')
  }
  // A cycloid stood on end: loops when r > k, a wave when r < k.
  const total = turns * 2 * Math.PI
  const span = k * total + 2 * r
  const scale = usable / span
  const pts: string[] = []
  for (let i = 0; i <= 240; i++) {
    const t = (i / 240) * total
    const x = 30 + r * Math.sin(t) * Math.min(1, scale * 1.4)
    const y = top + (k * t + r - r * Math.cos(t)) * scale
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

export default function CurlArt({ type }: { type: CurlType }) {
  return (
    <svg viewBox="0 0 60 100" aria-hidden="true" focusable="false">
      <path d={curlPath(type)} fill="none" stroke="var(--sunset-orange)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
