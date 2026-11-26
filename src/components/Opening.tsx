// The opening, from the brief: intro film, slowly to black, slowly to pink,
// "Hey beautiful," slides up and "Love the Curls" slides down, the words fade,
// and only "Start the quiz" stays. Reduce motion: cross-fades only (CSS).
//
// The film has music, and a phone only plays sound after a tap, so the opening
// waits on a gate first: the film's own first picture with "Tap to start".
// No film (straight to the words) with reduce motion or data saver on, or when
// the film can't start within FILM_WAIT_MS (no signal, a blocked video).
import { useEffect, useRef, useState } from 'react'

type Stage = 'gate' | 'film' | 'black' | 'pink' | 'words' | 'start'

// The film (public/intro/, cut by tools/make-intro-film.sh) and its first picture.
const FILM = './intro/intro.mp4'
const GATE = './intro/gate.webp'
const FILM_WAIT_MS = 2500

// After the film each stage leads to the next, in ms: black for 1.5 s, the
// change to pink 2 s, the words 3.5 s.
const NEXT: Partial<Record<Stage, [Stage, number]>> = {
  black: ['pink', 1500],
  pink: ['words', 2000],
  words: ['start', 3500],
}

const noFilm = () => {
  const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  return saver || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface Props {
  onStart: () => void
  skipToStart: boolean
  /** "Already a member? Log in": only once sign-ups are open (or in preview). */
  onLogIn?: () => void
}

export default function Opening({ onStart, skipToStart, onLogIn }: Props) {
  const [stage, setStage] = useState<Stage>(skipToStart ? 'start' : 'gate')
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const next = NEXT[stage]
    if (!next) return
    const timer = window.setTimeout(() => setStage(next[0]), next[1])
    return () => clearTimeout(timer)
  }, [stage])

  // A film that never starts (or stalls before its first frame) must not leave
  // the person on a frozen picture.
  const playing = useRef(false)
  useEffect(() => {
    if (stage !== 'film') return
    const timer = window.setTimeout(() => {
      if (!playing.current) setStage('black')
    }, FILM_WAIT_MS)
    return () => clearTimeout(timer)
  }, [stage])

  const afterFilm = () => setStage((s) => (s === 'film' ? 'black' : s))

  const begin = (withSound: boolean) => {
    const v = video.current
    if (!v || noFilm()) {
      setStage('pink')
      return
    }
    // play() has to be called inside the tap itself, or the phone refuses the sound.
    v.muted = !withSound
    playing.current = false
    setStage('film')
    v.play().catch(afterFilm)
  }

  const skip = () => {
    video.current?.pause()
    setStage('start')
  }

  const atGate = stage === 'gate'

  return (
    <div className={`opening is-${stage}`} data-stage={stage}>
      <div className="op-video" aria-hidden={!atGate}>
        {/* The gate's picture is the film's first frame, so the tap brings it to life. */}
        <img className="op-film" src={GATE} alt="" />
        {!skipToStart && (
          <video
            ref={video}
            className="op-film op-film-video"
            src={FILM}
            poster={GATE}
            preload="auto"
            playsInline
            onPlaying={() => (playing.current = true)}
            onEnded={afterFilm}
            onError={afterFilm}
          />
        )}
        {atGate && (
          <>
            <button className="op-tap" onClick={() => begin(true)} aria-label="Tap to start, with music" />
            <div className="op-gate">
              <p className="op-gate-name">Curly Girl Sanctuary</p>
              <button className="btn btn-primary op-gate-go" onClick={() => begin(true)}>
                Tap to start
              </button>
              <button className="btn btn-plain op-gate-quiet" onClick={() => begin(false)}>
                Start without sound
              </button>
              {onLogIn && (
                <button className="btn-link op-gate-login" onClick={onLogIn}>
                  Already a member? Log in
                </button>
              )}
            </div>
          </>
        )}
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
        {onLogIn && !atGate && (
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
