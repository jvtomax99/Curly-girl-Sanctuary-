// The default curly avatar: petal-like curls, glossy eyes, a warm smile, in several
// skin tones. Stand-in drawing until Susan's artwork (SPEC.md, "Needed from Susan").
export const AVATARS = ['curls-1', 'curls-2', 'curls-3', 'curls-4', 'curls-5'] as const

const PETALS = Array.from({ length: 11 }, (_, i) => {
  const a = Math.PI * (0.92 + (i / 10) * 1.16)
  return { x: 50 + Math.cos(a) * 30, y: 50 + Math.sin(a) * 30 }
})

export default function Avatar({ id, size = 96, label }: { id: string; size?: number; label?: string }) {
  const n = Math.max(1, AVATARS.indexOf(id as (typeof AVATARS)[number]) + 1)
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label ?? 'Curly avatar'}>
      <circle cx="50" cy="50" r="49" fill="var(--cream)" />
      {PETALS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="13" fill="var(--cocoa)" />
      ))}
      <circle cx="21" cy="66" r="11" fill="var(--cocoa)" />
      <circle cx="79" cy="66" r="11" fill="var(--cocoa)" />
      <ellipse cx="50" cy="57" rx="23" ry="25" fill={`var(--skin-${n})`} />
      <circle cx="41" cy="55" r="4.2" fill="var(--cocoa)" />
      <circle cx="59" cy="55" r="4.2" fill="var(--cocoa)" />
      <circle cx="42.4" cy="53.6" r="1.4" fill="var(--white)" />
      <circle cx="60.4" cy="53.6" r="1.4" fill="var(--white)" />
      <path d="M41 66 q9 8 18 0" stroke="var(--cocoa)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}
