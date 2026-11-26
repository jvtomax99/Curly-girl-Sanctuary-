// Moderator page (#/admin/products): products members added wait here for a check
// (approve or turn down), and two duplicates merge so every kit moves to the kept one.
// The server refuses all of this to anyone who isn't staff; this screen only asks.
import { useEffect, useState } from 'react'
import { approveProduct, loadMyProfile, mergeProducts, pendingProducts, turnDownProduct } from '../backend'
import { kindLabel, type Product } from '../engine/kit'
import ProductSearch from './ProductSearch'

interface Props {
  onSignedOut: () => void
  onBack: () => void
}

type Confirm = { kind: 'turn-down'; product: Product } | { kind: 'merge' } | null

const title = (p: Product) => `${p.name} (${p.brand})`

export default function AdminProducts({ onSignedOut, onBack }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'offline' | 'not-staff'>('loading')
  const [pending, setPending] = useState<Product[]>([])
  const [dup, setDup] = useState<Product | null>(null)
  const [keep, setKeep] = useState<Product | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const me = await loadMyProfile()
    if (me === 'offline') return setState('offline')
    if (!me) return onSignedOut()
    if (!me.staff) return setState('not-staff')
    const p = await pendingProducts()
    if (p === 'offline') return setState('offline')
    setPending(p)
    setState('ready')
  }

  useEffect(() => {
    load()
  }, [])

  if (state === 'loading') return <main className="screen"><p className="note" role="status">Loading…</p></main>
  if (state === 'not-staff') {
    return (
      <main className="screen">
        <h1 className="screen-title">Products</h1>
        <p className="note">This page is for the Sanctuary’s moderators.</p>
        <button className="btn-link" onClick={onBack}>Back to my profile</button>
      </main>
    )
  }
  if (state === 'offline') {
    return (
      <main className="screen">
        <h1 className="screen-title">Products</h1>
        <p className="note">This page needs a connection.</p>
        <button className="btn btn-plain" onClick={() => { setState('loading'); load() }}>Try again</button>
      </main>
    )
  }

  const act = async (work: () => Promise<{ ok: true } | { ok: false; error: string }>, said: string, after: () => void) => {
    setBusy(true)
    setMsg('')
    setError('')
    const r = await work()
    setBusy(false)
    setConfirm(null)
    if (!r.ok) return setError(r.error)
    after()
    setMsg(said)
  }

  const drop = (id: number) => setPending((list) => list.filter((p) => p.id !== id))

  const approve = (p: Product) => act(() => approveProduct(p.id), `Approved ${title(p)}. Everyone can find it now.`, () => drop(p.id))
  const turnDown = (p: Product) => act(() => turnDownProduct(p.id), `Turned down ${title(p)}. It left the member’s kit.`, () => drop(p.id))
  const merge = () => {
    if (!dup || !keep) return
    act(() => mergeProducts(dup.id, keep.id), `Merged. Every kit with ${title(dup)} now has ${title(keep)}.`, () => {
      drop(dup.id)
      setDup(null)
      setKeep(null)
    })
  }

  const sameAs = (p: Product) => {
    setDup(p)
    setKeep(null)
    setConfirm(null)
    requestAnimationFrame(() => document.getElementById('merge-title')?.scrollIntoView({ block: 'start' }))
  }

  return (
    <main className="screen admin">
      <h1 className="screen-title">Products</h1>
      <p className="note">For moderators. Who added a product is never shown here.</p>

      <section className="p-item" aria-labelledby="pending-title">
        <h2 id="pending-title" className="p-title">Waiting for a check ({pending.length})</h2>
        {pending.length === 0 && <p className="note">Nothing waiting.</p>}
        <ul className="kit-list">
          {pending.map((p) => (
            <li key={p.id} className="kit-product admin-item">
              <span className="kit-name">{p.name}</span>
              <span className="kit-meta">{p.brand} · {kindLabel(p.kind)}</span>
              {confirm?.kind === 'turn-down' && confirm.product.id === p.id ? (
                <div className="admin-confirm" role="group" aria-label={`Turn down ${p.name}?`}>
                  <p>Turn down {p.name}? It leaves the kit of the member who added it.</p>
                  <button className="btn btn-danger" onClick={() => turnDown(p)} disabled={busy}>Yes, turn it down</button>
                  <button className="btn-link" onClick={() => setConfirm(null)}>Cancel</button>
                </div>
              ) : (
                <div className="admin-actions">
                  <button className="btn btn-secondary" onClick={() => approve(p)} disabled={busy} aria-label={`Approve ${p.name}`}>Approve</button>
                  <button className="btn btn-plain" onClick={() => sameAs(p)} disabled={busy} aria-label={`${p.name} is already listed`}>Already listed</button>
                  <button className="btn-link" onClick={() => setConfirm({ kind: 'turn-down', product: p })} disabled={busy} aria-label={`Turn down ${p.name}`}>Turn down</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="p-item" aria-labelledby="merge-title">
        <h2 id="merge-title" className="p-title">Merge duplicates</h2>
        <p className="hint">Every kit with the duplicate moves to the one you keep, and the duplicate stops showing in suggestions.</p>

        {dup ? (
          <p className="p-value admin-pick">
            <span>Duplicate: {title(dup)}</span>
            <button className="btn-link" onClick={() => { setDup(null); setConfirm(null) }}>Change</button>
          </p>
        ) : (
          <ProductSearch label="1. Find the duplicate" blocked={(s) => (keep?.id === s.id ? 'Keeping this one' : null)} onPick={(s) => setDup(s)} disabled={busy} />
        )}

        {keep ? (
          <p className="p-value admin-pick">
            <span>Keep: {title(keep)}</span>
            <button className="btn-link" onClick={() => { setKeep(null); setConfirm(null) }}>Change</button>
          </p>
        ) : (
          <ProductSearch label="2. Find the one to keep" blocked={(s) => (dup?.id === s.id ? 'The duplicate' : null)} onPick={(s) => setKeep(s)} disabled={busy} />
        )}

        {dup && keep && (
          confirm?.kind === 'merge' ? (
            <div className="admin-confirm" role="group" aria-label="Merge these two?">
              <p>Move every kit with {title(dup)} to {title(keep)}? This can’t be undone from here.</p>
              <button className="btn btn-danger" onClick={merge} disabled={busy}>Yes, merge</button>
              <button className="btn-link" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-wide" onClick={() => { setMsg(''); setConfirm({ kind: 'merge' }) }} disabled={busy}>Merge</button>
          )
        )}
      </section>

      <p className="form-error" role="alert">{error}</p>
      <p className="note" role="status">{msg}</p>
      <button className="btn-link" onClick={onBack}>Back to my profile</button>
    </main>
  )
}
