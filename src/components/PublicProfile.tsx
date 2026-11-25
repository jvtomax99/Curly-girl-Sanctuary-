// Someone's profile from a shared link (#/u/<username>), as the server lets this
// viewer see it. Hidden items are simply not sent, so they can't be shown.
import { useEffect, useState } from 'react'
import { loadPublicProfile, type PublicProfile as P } from '../backend'
import { profileRows } from '../engine/profile'
import Avatar from './Avatar'
import IdCard from './IdCard'

interface Props {
  username: string
  loggedIn: boolean
  canJoin: boolean
  go: (hash: string) => void
}

export default function PublicProfile({ username, loggedIn, canJoin, go }: Props) {
  const [p, setP] = useState<P | 'offline' | null | 'loading'>('loading')
  useEffect(() => {
    setP('loading')
    loadPublicProfile(username).then(setP)
  }, [username, loggedIn])

  if (p === 'loading') return <main className="screen"><p className="note" role="status">Loading…</p></main>
  if (p === 'offline') return <main className="screen"><p className="note">This profile needs a connection.</p></main>
  if (!p) {
    return (
      <main className="screen">
        <h1 className="screen-title">Not found</h1>
        <p className="note">There’s no member called @{username}.</p>
      </main>
    )
  }

  const card = profileRows(p.items.filter((i) => i.item === 'card'))
  const scalp = profileRows(p.items.filter((i) => i.item === 'scalp'))[0]
  const heritage = profileRows(p.items.filter((i) => i.item === 'heritage'))[0]
  const kit = p.items.some((i) => i.item === 'kit')
  const nothing = !card.length && !scalp && !heritage && !kit

  return (
    <main className="screen profile">
      <header className="p-head">
        <Avatar id={p.avatar} label={`@${p.username}’s avatar`} />
        <h1 className="p-name">@{p.username}</h1>
      </header>
      {card.length > 0 && (
        <section className="p-item"><h2 className="p-title">Curly ID Card</h2><IdCard rows={card} /></section>
      )}
      {scalp && <section className="p-item"><h2 className="p-title">Scalp type</h2><p className="p-value">{scalp.value}</p></section>}
      {heritage && <section className="p-item"><h2 className="p-title">Heritage</h2><p className="p-value">{heritage.value}</p></section>}
      {kit && (
        <section className="p-item">
          <h2 className="p-title">Curl Kit</h2>
          <button className="btn btn-secondary btn-wide" onClick={() => go(`#/u/${p.username}/kit`)}>See @{p.username}’s Curl Kit</button>
        </section>
      )}
      {nothing && <p className="note">@{p.username} keeps their profile to {loggedIn ? 'themselves' : 'members'} for now.</p>}
      {!loggedIn && canJoin && (
        <div className="card-actions">
          <button className="btn btn-secondary" onClick={() => go('#/join')}>Join the Sanctuary</button>
          <button className="btn-link" onClick={() => go('#/login')}>Already a member? Log in</button>
        </div>
      )}
      {!loggedIn && !canJoin && (
        <div className="card-actions"><button className="btn btn-primary" onClick={() => go('#/quiz/0')}>Take the curl quiz</button></div>
      )}
    </main>
  )
}
