// Quiz-only results: the card, then broad tips for the hair type, each with
// its source. "Email my results" waits for the backend (SPEC.md).
import { cardRows, group } from '../engine/card'
import type { QuizState } from '../engine/state'
import { ALL_HAIR, DOCTOR, TIPS, type Tip } from '../data/tips'
import { SOURCES } from '../data/sources'
import IdCard from './IdCard'

export default function Tips({ state, onBack, onRetake }: { state: QuizState; onBack: () => void; onRetake: () => void }) {
  const gr = group(state)
  const set = gr ? TIPS[gr] : { title: 'Tips for every curl', intro: 'Good habits for every hair type.', tips: ALL_HAIR }
  const used = Array.from(new Set([...set.tips.map((t) => t.src), ...DOCTOR.src])).sort()

  return (
    <main className="screen tips">
      <div className="quiz-top">
        <button className="btn-link" onClick={onBack}>&#8592; My card</button>
      </div>
      <h1 className="screen-title">Your results</h1>
      <IdCard rows={cardRows(state)} />

      <h2>{set.title}</h2>
      <p className="q-help">{set.intro}</p>
      <ul>
        {set.tips.map((t: Tip) => (
          <li key={t.text}>
            {t.text}
            <span className="tip-src">
              Source: <a href={SOURCES[t.src].url} target="_blank" rel="noopener noreferrer">{SOURCES[t.src].by}</a>
            </span>
          </li>
        ))}
      </ul>

      <p className="doctor">{DOCTOR.text}</p>

      <h2>Sources</h2>
      <ol className="sources-list">
        {used.map((id) => (
          <li key={id}>
            <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">{SOURCES[id].title}</a>, {SOURCES[id].by}
          </li>
        ))}
      </ol>
      <p className="note">General information, not medical advice.</p>

      <div className="card-actions">
        <button className="btn btn-plain" onClick={onRetake}>Retake the quiz</button>
      </div>
    </main>
  )
}
