// The opening, from the brief: intro video slot, slowly to black, slowly to
// pink, "Hey beautiful," slides up and "Love the Curls" slides down, the words
// fade, and only "Start the quiz" stays. Reduce motion: cross-fades only (CSS).
import { useEffect, useState } from 'react'

type Stage = 'video' | 'black' | 'pink' | 'words' | 'start'

// When each stage starts, in ms from the beginning. The video slot is a
// placeholder until Susan's video exists, so it only shows briefly.
const TIMES: [Stage, number][] = [
  ['black', 2200],
  ['pink', 3700],
  ['words', 5700],
  ['start', 9200],
]

interface Props {
  onStart: () => void
  skipToStart: boolean
  /** "Already a member? Log in": only once sign-ups are open (or in preview). */
  onLogIn?: () => void
}

export default function Opening({ onStart, skipToStart, onLogIn }: Props) {
  const [stage, setStage] = useState<Stage>(skipToStart ? 'start' : 'video')

  useEffect(() => {
    if (skipToStart) return
    const timers = TIMES.map(([s, ms]) => window.setTimeout(() => setStage(s), ms))
    return () => timers.forEach(clearTimeout)
  }, [skipToStart])

  const skip = () => setStage('start')

  return (
    <div className={`opening is-${stage}`} data-stage={stage}>
      <div className="op-video" aria-hidden={stage !== 'video'}>
        <span className="op-leaf" style={{ left: -30, top: '22%', transform: 'rotate(35deg)' }} />
        <span className="op-leaf" style={{ right: -30, top: '30%', transform: 'rotate(-35deg)' }} />
        <span className="op-leaf" style={{ left: -40, top: '52%', transform: 'rotate(15deg)' }} />
        <div className="op-play" aria-hidden="true">
          <svg width="34" height="38" viewBox="0 0 34 38"><path d="M4 3 L31 19 L4 35 Z" fill="var(--sunset-orange)" /></svg>
        </div>
        <p className="op-video-note">Intro video coming soon</p>
      </div>

      <div className="op-words" aria-hidden={stage !== 'words'}>
        <p className="op-line op-line-up">Hey beautiful,</p>
        <p className="op-line op-line-down">
          Love the <span className="script">Curls</span>
        </p>
      </div>

      <div className="op-start">
        <h1 className="sr-only">Curly Girl Sanctuary</h1>
        <button className="btn btn-primary" onClick={onStart} tabIndex={stage === 'start' ? 0 : -1}>
          Start the quiz
        </button>
        {onLogIn && (
          <button className="btn btn-plain op-login" onClick={onLogIn} tabIndex={stage === 'start' ? 0 : -1}>
            Already a member? Log in
          </button>
        )}
      </div>

      {stage !== 'start' && (
        <button className="op-skip" onClick={skip}>
          Skip
        </button>
      )}
    </div>
  )
}
