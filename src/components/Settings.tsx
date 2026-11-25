// Account settings: curly username, avatar, names, log out, delete account.
import { useEffect, useState } from 'react'
import { deleteAccount, loadMyProfile, logOut, saveAccount, type MyProfile } from '../backend'
import { normalizeUsername, usernameProblem } from '../engine/profile'
import Avatar, { AVATARS } from './Avatar'

interface Props {
  go: (hash: string) => void
  onSignedOut: () => void
  onDeleted: (clearQuiz: boolean) => void
}

export default function Settings({ go, onSignedOut, onDeleted }: Props) {
  const [me, setMe] = useState<MyProfile | null>(null)
  const [f, setF] = useState({ username: '', avatar: 'curls-1', firstName: '', lastName: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [clearQuiz, setClearQuiz] = useState(false)
  const [delError, setDelError] = useState('')

  useEffect(() => {
    loadMyProfile().then((p) => {
      if (p === 'offline') return setError('Settings need a connection.')
      if (!p) return onSignedOut()
      setMe(p)
      setF({ username: p.username, avatar: p.avatar, firstName: p.firstName, lastName: p.lastName })
    })
  }, [onSignedOut])

  if (!me) return <main className="screen"><p className="note" role="status">{error || 'Loading…'}</p></main>

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    const username = normalizeUsername(f.username)
    const problem = usernameProblem(username) ?? (!f.firstName.trim() || !f.lastName.trim() ? 'Add your first and last name.' : null)
    if (problem) return setError(problem)
    setBusy(true)
    const r = await saveAccount(me.id, { ...f, username })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setMe({ ...me, ...f, username })
    setMsg('Saved.')
  }

  const remove = async () => {
    setDelError('')
    if (normalizeUsername(confirm) !== me.username) return setDelError(`Type ${me.username} to confirm.`)
    setBusy(true)
    const r = await deleteAccount()
    setBusy(false)
    if (r.ok) onDeleted(clearQuiz)
    else setDelError(r.error)
  }

  return (
    <main className="screen form-screen">
      <h1 className="screen-title">Settings</h1>
      <form onSubmit={save} noValidate>
        <fieldset className="avatars">
          <legend>Your avatar</legend>
          <div className="avatar-row">
            {AVATARS.map((a, i) => (
              <label key={a} className="avatar-pick">
                <input type="radio" name="avatar" value={a} checked={f.avatar === a} onChange={() => setF({ ...f, avatar: a })} />
                <Avatar id={a} size={52} label={`Avatar ${i + 1}`} />
              </label>
            ))}
          </div>
          <p className="hint">Stand-in drawings until the final artwork. Photos come with the community.</p>
        </fieldset>
        <label className="input">
          Curly username
          <span className="at-field"><span aria-hidden="true">@</span>
            <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={21} />
          </span>
        </label>
        <label className="input">First name<input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} maxLength={50} autoComplete="given-name" /></label>
        <label className="input">Last name<input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} maxLength={50} autoComplete="family-name" /></label>
        <p className="hint">Only you see your name.</p>
        <p className="form-error" role="alert">{error}</p>
        <p className="note" role="status">{msg}</p>
        <button className="btn btn-secondary btn-wide" disabled={busy}>Save</button>
      </form>

      <div className="settings-links">
        <a href="#/guidelines">Community guidelines</a>
        <a href="#/privacy">Privacy policy</a>
        <a href="#/terms">Terms</a>
      </div>
      <button className="btn btn-plain btn-wide" onClick={async () => { await logOut(); onSignedOut(); go('#/card') }}>Log out</button>

      <section className="danger" aria-labelledby="del-title">
        <h2 id="del-title">Delete my account</h2>
        <p>This removes your account, profile, Curly ID, Curl Kit and settings from the Sanctuary for good.</p>
        <label className="input"><span>Type <strong>{me.username}</strong> to confirm</span>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        <label className="check"><input type="checkbox" checked={clearQuiz} onChange={(e) => setClearQuiz(e.target.checked)} /> Also clear my quiz answers on this phone</label>
        <p className="form-error" role="alert">{delError}</p>
        <button className="btn btn-danger btn-wide" onClick={remove} disabled={busy}>Delete my account</button>
      </section>
    </main>
  )
}
