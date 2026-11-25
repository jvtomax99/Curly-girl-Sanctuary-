// Opened from the reset email: pick a new password.
import { useState } from 'react'
import { setPassword } from '../backend'

export default function NewPassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setError('At least 8 characters.')
    setBusy(true)
    const r = await setPassword(pw)
    setBusy(false)
    if (r.ok) onDone()
    else setError(r.error)
  }
  return (
    <main className="screen form-screen">
      <h1 className="screen-title">Pick a new password</h1>
      <form onSubmit={submit} noValidate>
        <label className="input">New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></label>
        <p className="form-error" role="alert">{error}</p>
        <button className="btn btn-secondary btn-wide" disabled={busy}>Save password</button>
      </form>
    </main>
  )
}
