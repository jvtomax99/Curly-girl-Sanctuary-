// "Join the Sanctuary": five fields, the age box and the guidelines box. The server
// refuses an account without both yeses (handle_new_user in the migration).
import { useState } from 'react'
import { MIN_AGE, join, usernameAvailable } from '../backend'
import { normalizeUsername, usernameProblem } from '../engine/profile'

interface Props {
  go: (hash: string) => void
  onJoined: () => void
}

export default function Join({ go, onJoined }: Props) {
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', username: '', password: '' })
  const [age, setAge] = useState(false)
  const [rules, setRules] = useState(false)
  const [nameNote, setNameNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const checkName = async () => {
    const problem = usernameProblem(f.username)
    if (problem) return setNameNote(f.username ? problem : '')
    const free = await usernameAvailable(normalizeUsername(f.username))
    setNameNote(free === false ? 'That one’s taken. Try another.' : free ? 'Available.' : '')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const username = normalizeUsername(f.username)
    const problem =
      !f.firstName.trim() || !f.lastName.trim() ? 'Add your first and last name.'
      : !/^\S+@\S+\.\S+$/.test(f.email.trim()) ? 'Check your email address.'
      : usernameProblem(username) ? `Curly username: ${usernameProblem(username)}`
      : f.password.length < 8 ? 'Pick a password of at least 8 characters.'
      : !age ? `Please confirm you’re ${MIN_AGE} or older.`
      : !rules ? 'Please accept the community guidelines.'
      : ''
    if (problem) return setError(problem)
    setBusy(true)
    if ((await usernameAvailable(username)) === false) {
      setBusy(false)
      return setError('That curly username is taken. Try another.')
    }
    const r = await join({ ...f, username })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    if (r.needsEmail) setSentTo(f.email.trim())
    else onJoined()
  }

  if (sentTo) {
    return (
      <main className="screen form-screen">
        <p className="label">Almost there</p>
        <h1 className="screen-title">Check your email</h1>
        <p>We sent a link to <strong>{sentTo}</strong>. Tap it on this phone to finish joining.</p>
        <p className="note">Nothing there? Look in spam, or wait a minute.</p>
        <button className="btn btn-plain" onClick={() => go('#/login')}>I’ve confirmed: log in</button>
      </main>
    )
  }

  return (
    <main className="screen form-screen">
      <h1 className="screen-title">Join the Sanctuary</h1>
      <form onSubmit={submit} noValidate>
        <label className="input">First name<input value={f.firstName} onChange={set('firstName')} autoComplete="given-name" maxLength={50} /></label>
        <label className="input">Last name<input value={f.lastName} onChange={set('lastName')} autoComplete="family-name" maxLength={50} /></label>
        <p className="hint">Your name is never shown to other members.</p>
        <label className="input">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" inputMode="email" /></label>
        <label className="input">
          Curly username
          <span className="at-field"><span aria-hidden="true">@</span>
            <input value={f.username} onChange={set('username')} onBlur={checkName} autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={21} aria-describedby="name-note" />
          </span>
        </label>
        <p className="hint" id="name-note" role="status">{nameNote || 'What other members see. Letters, numbers, _ and .'}</p>
        <label className="input">Password<input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" minLength={8} /></label>
        <label className="check"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> I’m {MIN_AGE} or older</label>
        <label className="check">
          <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} />
          <span>I accept the <a href="#/guidelines">community guidelines</a>, and I’ve read the <a href="#/privacy">privacy policy</a> and <a href="#/terms">terms</a></span>
        </label>
        <p className="form-error" role="alert">{error}</p>
        <button className="btn btn-secondary btn-wide" disabled={busy}>{busy ? 'Joining…' : 'Join'}</button>
      </form>
      <button className="btn-link" onClick={() => go('#/login')}>Already a member? Log in</button>
    </main>
  )
}
