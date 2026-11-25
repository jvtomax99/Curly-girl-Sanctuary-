// Type a brand or product and pick from the approved list, with how many members use
// each (a number, never who). Used by the Curl Kit and the moderator page.
import { useEffect, useId, useRef, useState } from 'react'
import { searchProducts } from '../backend'
import { kindLabel, membersLabel, searchable, type Suggestion } from '../engine/kit'

interface Props {
  label: string
  placeholder?: string
  /** A note that makes a result unpickable ("In your kit"), or null. */
  blocked?: (s: Suggestion) => string | null
  onPick: (s: Suggestion) => void
  /** Clears the box after a pick. */
  clearOnPick?: boolean
  disabled?: boolean
}

export default function ProductSearch({ label, placeholder = 'Type a brand or product', blocked, onPick, clearOnPick = true, disabled }: Props) {
  const id = useId()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [status, setStatus] = useState<'idle' | 'searching' | 'done' | 'offline'>('idle')
  const latest = useRef('')

  useEffect(() => {
    latest.current = q
    if (!searchable(q)) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('searching')
    const t = setTimeout(async () => {
      const r = await searchProducts(q.trim())
      if (latest.current !== q) return // a newer search is on its way
      if (r === 'offline') {
        setResults([])
        setStatus('offline')
      } else {
        setResults(r)
        setStatus('done')
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const said =
    status === 'searching' ? 'Looking…'
    : status === 'offline' ? 'Suggestions need a connection.'
    : status === 'done' ? (results.length ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}` : 'No matches yet.')
    : ''

  return (
    <div className="psearch">
      <label className="psearch-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="psearch-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        maxLength={60}
        disabled={disabled}
      />
      <p className="hint" role="status">{said}</p>
      {results.length > 0 && (
        <ul className="psearch-list">
          {results.map((s) => {
            const note = blocked?.(s) ?? null
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className="psearch-item"
                  disabled={!!note || disabled}
                  onClick={() => {
                    onPick(s)
                    if (clearOnPick) setQ('')
                  }}
                >
                  <span className="kit-name">{s.name}</span>
                  <span className="kit-meta">{s.brand} · {kindLabel(s.kind)}</span>
                  <span className="psearch-count">{note ?? membersLabel(s.members)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
