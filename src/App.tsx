// Screens by the address's # part, so the phone's Back gesture works:
// #/ opening, #/quiz/N question N+1, #/card, #/tips, #/soon.
import { useCallback, useEffect, useState } from 'react'
import { QUESTIONS } from './data/quiz'
import { answered, fresh, load, save, type QuizState } from './engine/state'
import Opening from './components/Opening'
import Quiz from './components/Quiz'
import CardScreen from './components/CardScreen'
import Tips from './components/Tips'
import Soon from './components/Soon'

type Route = { name: 'opening' } | { name: 'quiz'; step: number } | { name: 'card' } | { name: 'tips' } | { name: 'soon' }

function readRoute(): Route {
  const h = location.hash.replace(/^#\/?/, '')
  const m = /^quiz\/(\d+)$/.exec(h)
  if (m) return { name: 'quiz', step: Number(m[1]) }
  if (h === 'quiz') return { name: 'quiz', step: 0 }
  if (h === 'card' || h === 'tips' || h === 'soon') return { name: h }
  return { name: 'opening' }
}

/** The furthest question the person may open: the first one still unanswered. */
function furthest(s: QuizState): number {
  const i = QUESTIONS.findIndex((q) => !answered(s, q.id))
  return i === -1 ? QUESTIONS.length - 1 : i
}

const announce = () => window.dispatchEvent(new HashChangeEvent('hashchange'))

/** Forward: a new history step that remembers where it came from. */
const go = (hash: string) => {
  if (location.hash === hash) return
  history.pushState({ prev: location.hash || '#/' }, '', hash)
  announce()
}

/** The app's own Back buttons: step back through history when that is where it leads,
 *  so the phone's Back gesture keeps going backwards too; otherwise swap the screen
 *  without adding a step. */
const goBack = (hash: string) => {
  if ((history.state as { prev?: string } | null)?.prev === hash) history.back()
  else {
    history.replaceState(null, '', hash)
    announce()
  }
}

export default function App() {
  const [state, setState] = useState<QuizState>(load)
  const [route, setRoute] = useState<Route>(() => {
    const r = readRoute()
    if (r.name !== 'opening') return r
    // A fresh launch: a finished quiz opens the card, a started one resumes.
    const s = load()
    if (s.done) return { name: 'card' }
    if (Object.keys(s.answers).length > 0) return { name: 'quiz', step: s.step }
    return r
  })

  const update = useCallback((s: QuizState) => {
    setState(s)
    save(s)
  }, [])

  useEffect(() => {
    const on = () => setRoute(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // Keep the address in step with the screen chosen at launch.
  useEffect(() => {
    const want = route.name === 'quiz' ? `#/quiz/${route.step}` : route.name === 'opening' ? '' : `#/${route.name}`
    if (want && location.hash !== want) history.replaceState(null, '', want)
  }, [route])

  // Guard: no skipping ahead, and no card before the quiz is done.
  useEffect(() => {
    if (route.name === 'quiz') {
      const max = state.done ? QUESTIONS.length - 1 : furthest(state)
      const step = Math.min(route.step, max)
      if (step !== route.step) history.replaceState(null, '', `#/quiz/${step}`), setRoute({ name: 'quiz', step })
      else if (state.step !== step) update({ ...state, step })
    }
    if ((route.name === 'card' || route.name === 'tips' || route.name === 'soon') && !state.done) {
      history.replaceState(null, '', `#/quiz/${furthest(state)}`)
      setRoute({ name: 'quiz', step: furthest(state) })
    }
  }, [route, state, update])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const start = () => {
    update({ ...state, seenOpening: true })
    go(`#/quiz/${state.done ? 0 : state.step}`)
  }
  const retake = () => {
    update(fresh(true))
    go('#/quiz/0')
  }

  // The question on screen comes straight from the address (never past the first
  // unanswered one); state.step only remembers it for the next launch.
  const quizStep = route.name === 'quiz' ? Math.min(route.step, state.done ? QUESTIONS.length - 1 : furthest(state)) : 0

  if (route.name === 'opening') {
    return <Opening onStart={start} skipToStart={state.seenOpening} />
  }
  return (
    <div className="app">
      {route.name === 'quiz' && (
        <Quiz
          step={quizStep}
          state={state}
          onChange={update}
          onBack={() => goBack(quizStep === 0 ? '#/' : `#/quiz/${quizStep - 1}`)}
          onNext={() => {
            if (quizStep < QUESTIONS.length - 1) go(`#/quiz/${quizStep + 1}`)
            else {
              update({ ...state, done: true })
              go('#/card')
            }
          }}
        />
      )}
      {route.name === 'card' && (
        <CardScreen
          state={state}
          onJoin={() => go('#/soon')}
          onJustQuiz={() => go('#/tips')}
          onRetake={retake}
          onEdit={() => go('#/quiz/0')}
        />
      )}
      {route.name === 'tips' && <Tips state={state} onBack={() => goBack('#/card')} onRetake={retake} />}
      {route.name === 'soon' && <Soon onBack={() => goBack('#/card')} onTips={() => go('#/tips')} />}
    </div>
  )
}
