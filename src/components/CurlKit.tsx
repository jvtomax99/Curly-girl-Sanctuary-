// Your Curl Kit (#/kit): go-to products with suggestions, "Add your own", tools from a
// list, how I dry, and who sees it. Everything optional. Product names only, no links.
import { useEffect, useState } from 'react'
import {
  addOwnProduct,
  addToKit,
  loadMyKit,
  loadMyProfile,
  removeFromKit,
  searchProducts,
  setDry,
  setTool,
  setVisibility,
} from '../backend'
import { DRY, PRODUCT_KINDS, TOOLS, type Dry } from '../data/kit'
import { alreadyListed, kindLabel, newProductProblem, searchable, type Kit, type NewProduct } from '../engine/kit'
import { DEFAULT_VISIBILITY, type Visibility } from '../engine/profile'
import Audience from './Audience'
import ProductSearch from './ProductSearch'

interface Props {
  go: (hash: string) => void
  onBack: () => void
  onSignedOut: () => void
}

interface Me {
  id: string
  username: string
  visibility: Visibility
}

const BLANK: NewProduct = { brand: '', name: '', kind: '' }

export default function CurlKit({ go, onBack, onSignedOut }: Props) {
  const [me, setMe] = useState<Me | null>(null)
  const [kit, setKit] = useState<Kit | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [own, setOwn] = useState<NewProduct>(BLANK)
  const [ownError, setOwnError] = useState('')

  const load = async () => {
    const p = await loadMyProfile()
    if (p === 'offline') return setState('offline')
    if (!p) return onSignedOut()
    const k = await loadMyKit(p.id)
    if (k === 'offline') return setState('offline')
    setMe({ id: p.id, username: p.username, visibility: p.items.find((i) => i.item === 'kit')?.visibility ?? DEFAULT_VISIBILITY.kit })
    setKit(k)
    setState('ready')
  }

  useEffect(() => {
    load()
  }, [])

  if (state === 'loading') return <main className="screen"><p className="note" role="status">Loading your Curl Kit…</p></main>
  if (state === 'offline' || !me || !kit) {
    return (
      <main className="screen">
        <h1 className="screen-title">Curl Kit</h1>
        <p className="note">Your Curl Kit needs a connection.</p>
        <button className="btn btn-plain" onClick={() => { setState('loading'); load() }}>Try again</button>
      </main>
    )
  }

  /** Runs one change; on success updates the screen, otherwise says why. */
  const run = async (work: () => Promise<{ ok: true } | { ok: false; error: string }>, after: () => void, said = '') => {
    setBusy(true)
    setError('')
    setMsg('')
    const r = await work()
    setBusy(false)
    if (!r.ok) return setError(r.error)
    after()
    setMsg(said)
  }

  const inKit = (id: number) => kit.products.some((p) => p.id === id)

  const pick = (s: { id: number; brand: string; name: string; kind: string }) =>
    run(() => addToKit(me.id, s.id), () => setKit({ ...kit, products: [...kit.products, { ...s, pending: false }] }), `Added ${s.name}.`)

  const remove = (id: number, name: string) =>
    run(() => removeFromKit(me.id, id), () => setKit({ ...kit, products: kit.products.filter((p) => p.id !== id) }), `Removed ${name}.`)

  const addOwn = async (e: React.FormEvent) => {
    e.preventDefault()
    setOwnError('')
    const problem = newProductProblem(own)
    if (problem) return setOwnError(problem)
    const mine = alreadyListed(own, kit.products)
    if (mine) return setOwnError(`${mine.name} is already in your kit.`)
    setBusy(true)
    // Already listed under almost the same words? Add that one instead of a duplicate.
    // Search by the brand, the name and its longest word, so "curl-butter" still finds "Curl Butter".
    const longest = own.name.split(/[^\p{L}\p{N}]+/u).sort((x, y) => y.length - x.length)[0] ?? ''
    const found = await Promise.all([own.brand, own.name, longest].map((q) => q.trim()).filter(searchable).map(searchProducts))
    const listed = alreadyListed(own, found.flatMap((f) => (f === 'offline' ? [] : f)))
    setBusy(false)
    if (listed) {
      await pick(listed)
      setMsg(`${listed.name} by ${listed.brand} was already listed, so it’s in your kit now.`)
    } else {
      setBusy(true)
      const r = await addOwnProduct(me.id, own)
      setBusy(false)
      if (!r.ok || !r.product) return setOwnError(r.ok ? 'Something went wrong. Try again in a moment.' : r.error)
      setKit({ ...kit, products: [...kit.products, r.product] })
      setMsg(`Added ${r.product.name}. Only you see it until a moderator checks it.`)
    }
    setOwn(BLANK)
    setAdding(false)
  }

  const toggleTool = (tool: string) => {
    const on = !kit.tools.includes(tool)
    const tools = on ? TOOLS.map((t) => t.value).filter((t) => t === tool || kit.tools.includes(t)) : kit.tools.filter((t) => t !== tool)
    run(() => setTool(me.id, tool, on), () => setKit({ ...kit, tools }))
  }

  const chooseDry = (d: Dry) => {
    const dry = kit.dry === d ? null : d
    run(() => setDry(me.id, dry), () => setKit({ ...kit, dry }))
  }

  const changeAudience = (v: Visibility) => run(() => setVisibility(me.id, 'kit', v), () => setMe({ ...me, visibility: v }))

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/u/${me.username}/kit`
    try {
      if (navigator.share) await navigator.share({ title: `@${me.username}’s Curl Kit`, url })
      else {
        await navigator.clipboard.writeText(url)
        setMsg('Link copied.')
      }
    } catch {
      /* closed the share sheet */
    }
  }

  return (
    <main className="screen kit-screen">
      <h1 className="screen-title">My Curl Kit</h1>
      <p className="note">Everything here is optional. Product names only: no shopping links.</p>

      <Audience name="Curl Kit" value={me.visibility} onChange={changeAudience} busy={busy} />

      <section className="p-item" aria-labelledby="kit-products">
        <h2 id="kit-products" className="p-title">Go-to products</h2>
        {kit.products.length > 0 ? (
          <ul className="kit-list">
            {kit.products.map((p) => (
              <li key={p.id} className="kit-product kit-product-edit">
                <span className="kit-name">{p.name}</span>
                <span className="kit-meta">{p.brand} · {kindLabel(p.kind)}</span>
                {p.pending && <span className="kit-pending">Only you see this until a moderator checks it</span>}
                <button className="btn-link kit-remove" onClick={() => remove(p.id, p.name)} disabled={busy} aria-label={`Remove ${p.name}`}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">No products yet. Search below to add your first.</p>
        )}

        <ProductSearch label="Add a product" blocked={(s) => (inKit(s.id) ? 'In your kit' : null)} onPick={pick} disabled={busy} />

        {!adding ? (
          <button className="btn-link" onClick={() => setAdding(true)}>Can’t find it? Add your own</button>
        ) : (
          <form className="kit-own" onSubmit={addOwn} noValidate>
            <h3 className="kit-h">Add your own</h3>
            <label className="input">Brand<input value={own.brand} onChange={(e) => setOwn({ ...own, brand: e.target.value })} maxLength={60} autoComplete="off" /></label>
            <label className="input">Product name<input value={own.name} onChange={(e) => setOwn({ ...own, name: e.target.value })} maxLength={100} autoComplete="off" /></label>
            <label className="input">Type
              <select value={own.kind} onChange={(e) => setOwn({ ...own, kind: e.target.value })}>
                <option value="">Pick a type</option>
                {PRODUCT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </label>
            <p className="hint">Only you see it until a moderator checks it, then everyone can find it.</p>
            <p className="form-error" role="alert">{ownError}</p>
            <div className="kit-own-actions">
              <button className="btn btn-secondary" disabled={busy}>Add to my kit</button>
              <button type="button" className="btn-link" onClick={() => { setAdding(false); setOwn(BLANK); setOwnError('') }}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="p-item" aria-labelledby="kit-tools">
        <h2 id="kit-tools" className="p-title">Tools</h2>
        <div className="chips" role="group" aria-labelledby="kit-tools">
          {TOOLS.map((t) => (
            <button key={t.value} className="chip" aria-pressed={kit.tools.includes(t.value)} onClick={() => toggleTool(t.value)} disabled={busy}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="p-item" aria-labelledby="kit-dry">
        <h2 id="kit-dry" className="p-title">How I dry</h2>
        <div className="chips" role="group" aria-labelledby="kit-dry">
          {DRY.map((d) => (
            <button key={d.value} className="chip" aria-pressed={kit.dry === d.value} onClick={() => chooseDry(d.value)} disabled={busy}>
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <p className="form-error" role="alert">{error}</p>
      <p className="note" role="status">{msg}</p>
      <div className="card-actions">
        <button className="btn btn-primary" onClick={share}>Share my Curl Kit</button>
        <button className="btn-link" onClick={() => go(`#/u/${me.username}/kit`)}>See it as others do</button>
        <button className="btn-link" onClick={onBack}>Back to my profile</button>
      </div>
    </main>
  )
}
