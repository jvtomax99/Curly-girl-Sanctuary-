// Log in, and "Forgot password?" (sends a reset link).
import { useState } from 'react'
import { logIn, sendReset } from '../backend'

interface Props {
  go: (hash: string) => void
  onLoggedIn: () => void
  note?: string
  canJoin: boolean
  /** Opens on "Forgot password?" (after a reset link that couldn't be used here). */
  startForgot?: boolean
}

export default function LogIn({ go, onLoggedIn, note, canJoin, startForgot = false }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgot, setForgot] = useState(startForgot)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Check your email address.')
    setBusy(true)
    if (forgot) {
      const r = await sendReset(email)
      setBusy(false)
      return r.ok ? setMsg('If that email has an account, a reset link is on its way.') : setError(r.error)
    }
    const r = await logIn(email, password)
    setBusy(false)
    if (r.ok) onLoggedIn()
    else setError(r.error)
  }

  return (
    <main className="screen form-screen">
      <h1 className="screen-title">{forgot ? 'Reset your password' : 'Welcome back'}</h1>
      {note && <p className="banner">{note}</p>}
      <form onSubmit={submit} noValidate>
        <label className="input">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></label>
        {!forgot && (
          <label className="input">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        )}
        <p className="form-error" role="alert">{error}</p>
        <p className="note" role="status">{msg}</p>
        <button className="btn btn-secondary btn-wide" disabled={busy}>{busy ? 'One moment…' : forgot ? 'Send reset link' : 'Log in'}</button>
      </form>
      <button className="btn-link" onClick={() => { setForgot(!forgot); setError(''); setMsg('') }}>
        {forgot ? 'Back to log in' : 'Forgot password?'}
      </button>
      {canJoin && <button className="btn-link" onClick={() => go('#/join')}>New here? Join the Sanctuary</button>}
    </main>
  )
}
