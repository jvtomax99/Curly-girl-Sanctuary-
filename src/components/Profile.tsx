// Your own profile: each item with its own "who sees this" right beside it, and
// "See my profile as" to check what others get.
import { useEffect, useState } from 'react'
import { addItems, loadMyKit, loadMyProfile, loadPublicProfile, replaceAnswers, setVisibility, type MyProfile, type PublicProfile } from '../backend'
import { DEFAULT_VISIBILITY, hasCard, itemsFromQuiz, profileRows, visibleTo, type Item, type ItemId, type Visibility } from '../engine/profile'
import type { QuizState } from '../engine/state'
import { EMPTY_KIT, kitIsEmpty, shownToOthers, type Kit } from '../engine/kit'
import Audience from './Audience'
import KitList from './KitList'
import Avatar from './Avatar'
import IdCard from './IdCard'

interface Props {
  quiz: QuizState
  go: (hash: string) => void
  onSignedOut: () => void
}

type View = 'me' | 'community' | 'everyone'

export default function Profile({ quiz, go, onSignedOut }: Props) {
  const [me, setMe] = useState<MyProfile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [welcome, setWelcome] = useState(false)
  const [busy, setBusy] = useState<ItemId | 'quiz' | null>(null)
  const [msg, setMsg] = useState('')
  const [view, setView] = useState<View>('me')
  const [visitorView, setVisitorView] = useState<PublicProfile | 'offline' | null>(null)
  const [kit, setKit] = useState<Kit | 'offline'>(EMPTY_KIT)

  const refresh = async () => {
    const p = await loadMyProfile()
    if (p === 'offline') return setState('offline')
    if (!p) return onSignedOut()
    // First visit after joining: the quiz on this phone fills the profile.
    if (p.items.length === 0 && quiz.done) {
      const r = await addItems(p.id, itemsFromQuiz(quiz))
      if (r.ok) {
        setWelcome(true)
        const again = await loadMyProfile()
        if (again && again !== 'offline') p.items = again.items
      }
    }
    setKit(await loadMyKit(p.id))
    setMe(p)
    setState('ready')
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (view !== 'everyone' || !me) return
    setVisitorView(null)
    loadPublicProfile(me.username, true).then(setVisitorView)
  }, [view, me])

  if (state === 'loading') return <main className="screen"><p className="note" role="status">Loading your profile…</p></main>
  if (state === 'offline' || !me) {
    return (
      <main className="screen">
        <h1 className="screen-title">Profile</h1>
        <p className="note">Your profile needs a connection. Your Curly ID Card is still on this phone.</p>
        <button className="btn btn-plain" onClick={() => { setState('loading'); refresh() }}>Try again</button>
      </main>
    )
  }

  const get = (id: ItemId): Item | undefined => me.items.find((i) => i.item === id)
  const vis = (id: ItemId): Visibility => get(id)?.visibility ?? DEFAULT_VISIBILITY[id]

  const change = async (id: ItemId, v: Visibility) => {
    setBusy(id)
    setMsg('')
    const r = await setVisibility(me.id, id, v)
    setBusy(null)
    if (!r.ok) return setMsg(r.error)
    const items = get(id) ? me.items.map((i) => (i.item === id ? { ...i, visibility: v } : i)) : [...me.items, { item: id, value: {}, visibility: v }]
    setMe({ ...me, items })
  }

  const useLatestQuiz = async () => {
    setBusy('quiz')
    setMsg('')
    const r = await replaceAnswers(me.id, itemsFromQuiz(quiz), me.items)
    if (!r.ok) {
      setBusy(null)
      return setMsg(r.error)
    }
    await refresh()
    setBusy(null)
    setMsg('Your profile now has your latest quiz answers.')
  }

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/u/${me.username}`
    try {
      if (navigator.share) await navigator.share({ title: `@${me.username} on Curly Girl Sanctuary`, url })
      else {
        await navigator.clipboard.writeText(url)
        setMsg('Link copied.')
      }
    } catch {
      /* closed the share sheet */
    }
  }

  const shown: Item[] | null =
    view === 'me' ? me.items : view === 'community' ? visibleTo('community', me.items) : visitorView && visitorView !== 'offline' ? visitorView.items : null

  const section = (id: ItemId, body: React.ReactNode) => (
    <section className="p-item" aria-labelledby={`h-${id}`}>
      {body}
      {view === 'me' && <Audience name={id === 'card' ? 'Curly ID Card' : id === 'scalp' ? 'scalp type' : id === 'kit' ? 'Curl Kit' : 'heritage'} value={vis(id)} onChange={(v) => change(id, v)} busy={busy === id} />}
    </section>
  )

  const items = shown ?? []
  const cardRows = profileRows(items.filter((i) => i.item === 'card'))
  const scalpRow = profileRows(items.filter((i) => i.item === 'scalp'))[0]
  const heritageRow = profileRows(items.filter((i) => i.item === 'heritage'))[0]

  return (
    <main className="screen profile">
      <header className="p-head">
        <Avatar id={me.avatar} label={`@${me.username}’s avatar`} />
        <h1 className="p-name">@{me.username}</h1>
        <div className="card-tools">
          <button className="btn-link" onClick={share}>Share my profile</button>
          <button className="btn-link" onClick={() => go('#/settings')}>Settings</button>
          {me.staff && <button className="btn-link" onClick={() => go('#/admin/products')}>Moderate products</button>}
        </div>
      </header>

      {welcome && (
        <p className="banner">
          Your Curly ID is saved. Choose who sees each part.
          {quiz.showHeritage && get('heritage') && ' On the quiz you chose to show your heritage: it starts as Only me here, so pick who sees it below.'}
        </p>
      )}

      <p className="seeas-label" id="seeas-label">See my profile as</p>
      <div className="seeas" role="group" aria-labelledby="seeas-label">
        {(['me', 'community', 'everyone'] as View[]).map((v) => (
          <button key={v} className="seeas-btn" aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'me' ? 'Me' : v === 'community' ? 'Community' : 'Everyone'}
          </button>
        ))}
      </div>
      {view !== 'me' && (
        <p className="note" role="status">
          {view === 'everyone'
            ? visitorView === null ? 'Asking the server…' : visitorView === 'offline' ? 'Needs a connection.' : 'This is exactly what the server shows someone who isn’t logged in.'
            : 'What logged-in members see.'}
        </p>
      )}

      {section('card', hasCard(me.items) ? (
        <>
          <h2 id="h-card" className="p-title">Curly ID Card</h2>
          {cardRows.length ? <IdCard rows={cardRows} /> : <p className="p-hidden">Hidden</p>}
        </>
      ) : (
        <>
          <h2 id="h-card" className="p-title">Curly ID Card</h2>
          <p className="note">Take the quiz on this phone to fill your card.</p>
          {view === 'me' && <button className="btn btn-primary" onClick={() => go('#/quiz/0')}>Take the quiz</button>}
        </>
      ))}

      {get('scalp') && section('scalp', (
        <>
          <h2 id="h-scalp" className="p-title">Scalp type</h2>
          <p className="p-value">{scalpRow ? scalpRow.value : <span className="p-hidden">Hidden</span>}</p>
        </>
      ))}

      {get('heritage') && section('heritage', (
        <>
          <h2 id="h-heritage" className="p-title">Heritage</h2>
          <p className="p-value">{heritageRow ? heritageRow.value : <span className="p-hidden">Hidden</span>}</p>
        </>
      ))}

      {section('kit', (
        <>
          <h2 id="h-kit" className="p-title">Curl Kit</h2>
          {kit === 'offline' ? (
            <p className="note">Your Curl Kit needs a connection.</p>
          ) : view === 'me' ? (
            <>
              <KitList kit={kit} owner level={3} empty="Nothing in your Curl Kit yet: your go-to products, tools and how you dry." />
              <button className="btn btn-secondary btn-wide kit-edit" onClick={() => go('#/kit')}>{kitIsEmpty(kit) ? 'Start my Curl Kit' : 'Edit my Curl Kit'}</button>
            </>
          ) : kitIsEmpty(shownToOthers(kit)) ? (
            <p className="note">Nothing in the Curl Kit yet.</p>
          ) : items.some((i) => i.item === 'kit') ? (
            <KitList kit={shownToOthers(kit)} level={3} />
          ) : (
            <p className="p-hidden">Hidden</p>
          )}
        </>
      ))}

      {view === 'me' && quiz.done && (
        <button className="btn-link" onClick={useLatestQuiz} disabled={busy === 'quiz'}>Use my latest quiz answers</button>
      )}
      <p className="note" role="status">{msg}</p>
    </main>
  )
}
