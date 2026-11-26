// The opening, from the brief: intro film, slowly to black, slowly to pink,
// "Hey beautiful," slides up and "Love the Curls" slides down, the words fade,
// and only "Start the quiz" stays. Reduce motion: cross-fades only (CSS).
//
// The film has music, and a phone only plays sound after a tap, so the opening
// waits on a gate first: the film's own first picture with "Tap to start".
// No film (straight to the words) with reduce motion or data saver on. A film
// that can't start, or stops moving part-way (no signal, the phone locked), is
// passed over: the opening never waits on a frozen picture.
import { useEffect, useRef, useState } from 'react'
import FilmApp, { type AppBeat } from './FilmApp'

type Stage = 'gate' | 'film' | 'black' | 'pink' | 'words' | 'start'

// The film (public/intro/, cut by tools/make-intro-film.sh) and its first picture.
const FILM = './intro/intro.mp4'
const GATE = './intro/gate.webp'
// The film's app scene, in seconds on the film's own clock: the curl picker
// appears, one curl is picked, the Curly ID Card takes its place, and it all
// fades out just before the next shot. These must match tools/make-intro-film.sh.
const APP: [number, AppBeat][] = [
  [9.3, 'off'],
  [9.1, 'leaving'],
  [7.35, 'card'],
  [6.3, 'picked'],
  [5.15, 'picker'],
]
const beatAt = (t: number): AppBeat => APP.find(([from]) => t >= from)?.[1] ?? 'off'

// How long the film may stand still before the opening moves on without it.
const START_WAIT_MS = 4000
const STALL_WAIT_MS = 3000

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
  const [beat, setBeat] = useState<AppBeat>('off')
  // Keyboard and screen-reader focus follows the opening: Skip while it plays,
  // "Start the quiz" when it ends, so it never falls back to the page.
  const skipBtn = useRef<HTMLButtonElement>(null)
  const startBtn = useRef<HTMLButtonElement>(null)
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current) return
    if (stage === 'start') startBtn.current?.focus({ preventScroll: true })
    else if (stage === 'film' || stage === 'pink') skipBtn.current?.focus({ preventScroll: true })
  }, [stage])

  useEffect(() => {
    const next = NEXT[stage]
    if (!next) return
    const timer = window.setTimeout(() => setStage(next[0]), next[1])
    return () => clearTimeout(timer)
  }, [stage])

  // Decided once: these people never see the film, so it is never downloaded.
  const [filmOff] = useState(() => skipToStart || noFilm())

  const stopFilm = () => video.current?.pause()
  const afterFilm = () => {
    stopFilm()
    setStage((s) => (s === 'film' ? 'black' : s))
  }

  // While the film is on, check that it keeps moving. If its clock stands still
  // (never started, lost signal, paused by the phone), stop it and carry on, so
  // its music can't start late over the words.
  useEffect(() => {
    if (stage !== 'film') return
    let last = -1
    let since = performance.now()
    const tick = window.setInterval(() => {
      const v = video.current
      if (!v) return afterFilm()
      const now = performance.now()
      if (document.hidden) {
        since = now
        return
      }
      if (v.currentTime !== last) {
        last = v.currentTime
        since = now
        return
      }
      if (now - since > (last <= 0 ? START_WAIT_MS : STALL_WAIT_MS)) afterFilm()
    }, 250)
    // Back from another app: the phone paused the film; carry on with it.
    const back = () => {
      if (!document.hidden && video.current?.paused) video.current.play().catch(afterFilm)
    }
    document.addEventListener('visibilitychange', back)
    // The app scene follows the film's clock, frame by frame.
    let frame = 0
    const follow = () => {
      const v = video.current
      if (v) setBeat(beatAt(v.currentTime))
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => {
      cancelAnimationFrame(frame)
      setBeat('off')
      clearInterval(tick)
      document.removeEventListener('visibilitychange', back)
    }
  }, [stage])

  const begin = (withSound: boolean) => {
    moved.current = true
    const v = video.current
    if (!v) {
      setStage('pink')
      return
    }
    // play() has to be called inside the tap itself, or the phone refuses the sound.
    v.muted = !withSound
    setStage('film')
    v.play().catch(afterFilm)
  }

  const skip = () => {
    moved.current = true
    const v = video.current
    if (v) {
      // Stop the film and its download.
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
    setStage('start')
  }

  const atGate = stage === 'gate'

  return (
    <div className={`opening is-${stage}`} data-stage={stage}>
      <h1 className="sr-only">Curly Girl Sanctuary</h1>
      <div className="op-video" aria-hidden={!atGate}>
        {/* The gate's picture is the film's first frame, so the tap brings it to life. */}
        {!skipToStart && stage !== 'start' && <img className="op-film" src={GATE} alt="" />}
        {!filmOff && (
          <video
            ref={video}
            className="op-film op-film-video"
            src={FILM}
            poster={GATE}
            preload="auto"
            playsInline
            onEnded={afterFilm}
            onError={afterFilm}
          />
        )}
        {stage === 'film' && <FilmApp beat={beat} />}
        {atGate && (
          <>
            {/* For fingers only: the buttons below do the same for keyboards and screen readers. */}
            <button className="op-tap" onClick={() => begin(true)} tabIndex={-1} aria-hidden="true" />
            <div className="op-gate">
              <p className="op-gate-name" aria-hidden="true">Curly Girl Sanctuary</p>
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

      <div className="op-start" aria-hidden={stage !== 'start'}>
        <button ref={startBtn} className="btn btn-primary" onClick={onStart} tabIndex={stage === 'start' ? 0 : -1}>
          Start the quiz
        </button>
        {onLogIn && !atGate && (
          <button className="btn btn-plain op-login" onClick={onLogIn} tabIndex={stage === 'start' ? 0 : -1}>
            Already a member? Log in
          </button>
        )}
      </div>

      {stage !== 'start' && (
        <button ref={skipBtn} className="op-skip" onClick={skip}>
          Skip
        </button>
      )}
    </div>
  )
}
