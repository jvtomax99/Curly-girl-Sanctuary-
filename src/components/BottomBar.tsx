// Members' bottom bar: Community, Learn, Curl Lab, Profile (the brief's suggestion).
const TABS = [
  { hash: '#/community', label: 'Community' },
  { hash: '#/learn', label: 'Learn' },
  { hash: '#/lab', label: 'Curl Lab' },
  { hash: '#/profile', label: 'Profile' },
]

export default function BottomBar({ current, go }: { current: string; go: (hash: string) => void }) {
  return (
    <nav className="bottombar" aria-label="Sections">
      {TABS.map((t) => (
        <a
          key={t.hash}
          href={t.hash}
          className="tab"
          aria-current={current === t.hash ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            go(t.hash)
          }}
        >
          {t.label}
        </a>
      ))}
    </nav>
  )
}
