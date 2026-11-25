import { useState } from 'react'
import { cardRows } from '../engine/card'
import type { QuizState } from '../engine/state'
import { shareCard } from '../cardImage'
import IdCard from './IdCard'

interface Props {
  state: QuizState
  onJoin: () => void
  onJustQuiz: () => void
  onRetake: () => void
  onEdit: () => void
}

export default function CardScreen({ state, onJoin, onJustQuiz, onRetake, onEdit }: Props) {
  const rows = cardRows(state)
  const [msg, setMsg] = useState('')

  const share = async () => {
    setMsg('')
    try {
      const r = await shareCard(rows)
      if (r === 'downloaded') setMsg('Saved as a picture.')
    } catch {
      setMsg('Couldn’t make the picture on this device. A screenshot works too.')
    }
  }

  return (
    <main className="screen">
      <h1 className="screen-title">Your Curly ID</h1>
      <IdCard rows={rows} />
      <div className="card-tools">
        <button className="btn-link" onClick={share}>Save or share my card</button>
        <button className="btn-link" onClick={onEdit}>Change an answer</button>
      </div>
      <p className="note" role="status">{msg}</p>
      <div className="card-lead">
        <strong>Love your results?</strong>
        Join to save them, post and learn.
      </div>
      <div className="card-actions">
        <button className="btn btn-secondary" onClick={onJoin}>Join the Sanctuary</button>
        <button className="btn btn-plain" onClick={onJustQuiz}>No thanks, just the quiz</button>
        <button className="btn-link" onClick={onRetake}>Retake the quiz</button>
      </div>
    </main>
  )
}
