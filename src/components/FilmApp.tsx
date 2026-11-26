// The film's "this is the app" scene: the real curl picker and the real Curly
// ID Card, drawn by the app over a quiet stretch of the film, so every word is
// sharp real text. Nothing here can be tapped; it is a picture of the app.
// The answers are made up (they are labelled Example).
import CurlArt from './CurlArt'
import IdCard from './IdCard'
import { CURL_TYPES, QUESTIONS } from '../data/quiz'
import { cardRows } from '../engine/card'
import { fresh } from '../engine/state'

/** What the scene shows: nothing, the picker, the picker with one curl picked, the card. */
export type AppBeat = 'off' | 'picker' | 'picked' | 'card'

const PICK = '3B'
const EXAMPLE = cardRows({
  ...fresh(),
  answers: { pattern: [PICK], porosity: ['medium'], thickness: ['fine'], density: ['medium'], scalp: ['balanced'] },
})

export default function FilmApp({ beat }: { beat: AppBeat }) {
  if (beat === 'off') return null
  const card = beat === 'card'
  return (
    <div className={`op-app is-${beat}`} aria-hidden="true">
      <div className="op-app-sheet">
        <p className="op-app-tag">Example</p>
        <div className={`op-app-step${card ? ' is-gone' : ''}`}>
          <p className="op-app-q">{QUESTIONS[0].title}</p>
          <div className="curl-grid">
            {CURL_TYPES.map((t) => (
              <div key={t} className="curl" aria-pressed={beat !== 'picker' && t === PICK}>
                <CurlArt type={t} />
                <span className="curl-name">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`op-app-step op-app-card${card ? '' : ' is-gone'}`}>
          <p className="op-app-q">Your Curly ID</p>
          <IdCard rows={EXAMPLE} />
          <p className="op-app-pill">Save or share my card</p>
        </div>
      </div>
    </div>
  )
}
