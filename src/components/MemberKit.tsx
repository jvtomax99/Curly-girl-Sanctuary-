// Someone's Curl Kit from a shared link (#/u/<username>/kit), as the server lets this
// viewer see it. A kit outside this viewer's audience isn't sent, so it can't be shown.
import { useEffect, useState } from 'react'
import { loadMemberKit, type MemberKit as MK } from '../backend'
import { EMPTY_KIT } from '../engine/kit'
import Avatar from './Avatar'
import KitList from './KitList'

interface Props {
  username: string
  loggedIn: boolean
  /** The logged-in member's id, so their own link shows what waits for a check. */
  myId: string | null
  canJoin: boolean
  go: (hash: string) => void
}

export default function MemberKit({ username, loggedIn, myId, canJoin, go }: Props) {
  const [k, setK] = useState<MK | 'offline' | null | 'loading'>('loading')
  useEffect(() => {
    setK('loading')
    loadMemberKit(username).then(setK)
  }, [username, loggedIn])

  if (k === 'loading') return <main className="screen"><p className="note" role="status">Loading…</p></main>
  if (k === 'offline') return <main className="screen"><p className="note">This Curl Kit needs a connection.</p></main>
  if (!k) {
    return (
      <main className="screen">
        <h1 className="screen-title">Not found</h1>
        <p className="note">There’s no member called @{username}.</p>
      </main>
    )
  }
  const mine = !!myId && myId === k.id

  return (
    <main className="screen profile">
      <header className="p-head">
        <Avatar id={k.avatar} label={`@${k.username}’s avatar`} />
        <h1 className="p-name">@{k.username}’s Curl Kit</h1>
      </header>
      <div className="p-item">
        {k.kit || mine ? (
          <KitList kit={k.kit ?? EMPTY_KIT} owner={mine} empty={mine ? 'Your Curl Kit is empty so far.' : `@${k.username} hasn’t added anything yet.`} />
        ) : (
          <p className="note">@{k.username} keeps their Curl Kit to {loggedIn ? 'themselves' : 'members'} for now.</p>
        )}
      </div>
      <div className="card-actions">
        {mine && <button className="btn btn-secondary" onClick={() => go('#/kit')}>Edit my Curl Kit</button>}
        <button className="btn-link" onClick={() => go(`#/u/${k.username}`)}>See @{k.username}’s profile</button>
        {!loggedIn && canJoin && (
          <>
            <button className="btn btn-secondary" onClick={() => go('#/join')}>Join the Sanctuary</button>
            <button className="btn-link" onClick={() => go('#/login')}>Already a member? Log in</button>
          </>
        )}
        {!loggedIn && !canJoin && <button className="btn btn-primary" onClick={() => go('#/quiz/0')}>Take the curl quiz</button>}
      </div>
    </main>
  )
}
