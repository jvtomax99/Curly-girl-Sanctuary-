// Screens by the address's # part, so the phone's Back gesture works:
// #/ opening, #/quiz/N question N+1, #/card, #/tips, #/soon.
// Members (Phase 2): #/join, #/login, #/reset, #/profile, #/settings, #/u/<username>,
// #/community, #/learn, #/lab, #/guidelines, #/privacy, #/terms; #/preview turns on
// sign-ups on this phone for testing.
import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isPreview, sb, setPreview, signupsOpen } from './backend'
import { KEY } from './engine/state'
import { QUESTIONS } from './data/quiz'
import { answered, fresh, load, save, type QuizState } from './engine/state'
import Opening from './components/Opening'
import Quiz from './components/Quiz'
import CardScreen from './components/CardScreen'
import Tips from './components/Tips'
import Soon from './components/Soon'
import Join from './components/Join'
import LogIn from './components/LogIn'
import NewPassword from './components/NewPassword'
import Profile from './components/Profile'
import PublicProfile from './components/PublicProfile'
import Settings from './components/Settings'
import BottomBar from './components/BottomBar'
import TabSoon from './components/TabSoon'
import Legal from './components/Legal'
import NotFound from './components/NotFound'

const SIMPLE = ['card', 'tips', 'soon', 'join', 'login', 'reset', 'profile', 'settings', 'preview', 'community', 'learn', 'lab'] as const
const LEGAL = ['guidelines', 'privacy', 'terms'] as const
type Simple = (typeof SIMPLE)[number]

type Route =
  | { name: 'opening' }
  | { name: 'quiz'; step: number }
  | { name: Simple }
  | { name: 'legal'; doc: string }
  | { name: 'member'; username: string }
  | { name: 'missing' }

/** Screens that need a logged-in member. */
const MEMBERS_ONLY = new Set<string>(['profile', 'settings', 'reset', 'community', 'learn', 'lab'])
/** Screens about the quiz, which need it finished first. */
const AFTER_QUIZ = new Set<string>(['card', 'tips', 'soon'])

function readRoute(): Route {
  const h = location.hash.replace(/^#\/?/, '').replace(/\/+$/, '') // #/card/ is #/card
  const m = /^quiz\/(\d+)$/.exec(h)
  if (m) return { name: 'quiz', step: Number(m[1]) }
  if (h === 'quiz') return { name: 'quiz', step: 0 }
  const u = /^u\/([a-z0-9_.]{3,20})$/i.exec(h)
  if (u) return { name: 'member', username: u[1].toLowerCase() }
  if ((LEGAL as readonly string[]).includes(h)) return { name: 'legal', doc: h }
  if ((SIMPLE as readonly string[]).includes(h)) return { name: h as Simple }
  // An app address that doesn't exist (a typo, an old link): say so. Anything else after the #
  // (empty, or what a sign-in service may leave) opens the app as usual.
  if (location.hash.startsWith('#/') && h !== '') return { name: 'missing' }
  return { name: 'opening' }
}

const SITE = 'Curly Girl Sanctuary'
const SCREEN_NAMES: Record<string, string> = {
  card: 'Your Curly ID Card', tips: 'Your results', soon: 'Join the Sanctuary', join: 'Join the Sanctuary',
  login: 'Log in', reset: 'New password', profile: 'My profile', settings: 'Settings', preview: SITE,
  community: 'Community', learn: 'Learn', lab: 'Curl Lab', missing: 'Page not found',
  guidelines: 'Community guidelines', privacy: 'Privacy policy', terms: 'Terms of use',
}
/** The browser tab's name for each screen. */
function titleOf(r: Route): string {
  if (r.name === 'opening') return `${SITE} · Take the curl quiz`
  if (r.name === 'quiz') return `Question ${r.step + 1} of ${QUESTIONS.length} · ${SITE}`
  if (r.name === 'member') return `@${r.username} · ${SITE}`
  const name = SCREEN_NAMES[r.name === 'legal' ? r.doc : r.name] ?? SITE
  return name === SITE ? SITE : `${name} · ${SITE}`
}

const hashOf = (r: Route) =>
  r.name === 'quiz' ? `#/quiz/${r.step}` : r.name === 'opening' ? '' : r.name === 'legal' ? `#/${r.doc}` : r.name === 'member' ? `#/u/${r.username}` : r.name === 'missing' ? '' : `#/${r.name}`

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

/** What an email link left in the address (?code=, ?reset=1, ?error_description=). */
function readLink() {
  const q = new URLSearchParams(location.search)
  return { code: q.has('code'), reset: q.get('reset') === '1', error: q.get('error_description') }
}
const clearLink = (hash: string) => history.replaceState(null, '', location.pathname + hash)

export default function App() {
  const [state, setState] = useState<QuizState>(load)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!sb)
  const [loginNote, setLoginNote] = useState('')
  const [loginForgot, setLoginForgot] = useState(false)
  const [route, setRoute] = useState<Route>(() => {
    const r = readRoute()
    if (r.name !== 'opening') return r
    if (sb && (readLink().code || readLink().error)) return { name: 'login' } // an email link: settled once the session is known
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

  // Sign-in state, and the links in emails (confirm sign-up, reset password).
  useEffect(() => {
    if (!sb) return
    const link = readLink()
    const settle = (s: Session | null) => {
      if (!link.code && !link.error) return
      link.code = false
      if (link.error) {
        setLoginNote('That link has expired or was already used. Log in, or ask for a new one.')
        clearLink('#/login')
      } else if (s) clearLink(link.reset ? '#/reset' : '#/profile')
      else if (link.reset) {
        // The reset link only works in the browser that asked for it (an app on the home
        // screen and Safari don't share sign-ins, nor do email apps' own browsers).
        setLoginNote('Open the reset link in the same app or browser you asked from, or ask for a new link here.')
        setLoginForgot(true)
        clearLink('#/login')
      } else {
        // Opened on another phone or browser: the email is confirmed, the session isn't here.
        setLoginNote('Your email is confirmed. Log in to continue.')
        clearLink('#/login')
      }
      link.error = null
      setRoute(readRoute())
    }
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') {
        clearLink('#/reset')
        setRoute(readRoute())
      }
    })
    sb.auth.getSession().then(({ data: d }) => {
      setSession(d.session)
      setAuthReady(true)
      settle(d.session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Keep the address in step with the screen chosen at launch.
  useEffect(() => {
    const want = hashOf(route)
    if (want && location.hash !== want) history.replaceState(null, '', want)
  }, [route])

  // #/preview: turns sign-ups on for this phone (testing before they open to everyone).
  useEffect(() => {
    if (route.name !== 'preview') return
    setPreview(true)
    history.replaceState(null, '', state.done ? '#/card' : '#/')
    setRoute(readRoute())
  }, [route, state.done])

  // Members-only screens need a session; join and log in don't once you have one.
  useEffect(() => {
    if (!authReady) return
    if (!sb && (MEMBERS_ONLY.has(route.name) || route.name === 'login')) {
      // No accounts in this build: a log-in form that can't log anyone in would only mislead.
      history.replaceState(null, '', '#/soon')
      setRoute({ name: 'soon' })
    } else if (MEMBERS_ONLY.has(route.name) && !session) {
      history.replaceState(null, '', '#/login')
      setRoute({ name: 'login' })
    } else if ((route.name === 'join' || route.name === 'login') && session) {
      history.replaceState(null, '', '#/profile')
      setRoute({ name: 'profile' })
    } else if (route.name === 'join' && !signupsOpen()) {
      history.replaceState(null, '', '#/soon')
      setRoute({ name: 'soon' })
    }
  }, [route, session, authReady])

  // Guard: no skipping ahead, and no card before the quiz is done.
  useEffect(() => {
    if (route.name === 'quiz') {
      const max = state.done ? QUESTIONS.length - 1 : furthest(state)
      const step = Math.min(route.step, max)
      if (step !== route.step) history.replaceState(null, '', `#/quiz/${step}`), setRoute({ name: 'quiz', step })
      else if (state.step !== step) update({ ...state, step })
    }
    if (AFTER_QUIZ.has(route.name) && !state.done) {
      history.replaceState(null, '', `#/quiz/${furthest(state)}`)
      setRoute({ name: 'quiz', step: furthest(state) })
    }
  }, [route, state, update])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = titleOf(route)
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

  const canJoin = signupsOpen()
  const join = () => go(session ? '#/profile' : canJoin ? '#/join' : '#/soon')
  const toProfile = () => go('#/profile')
  const signedOut = useCallback(() => setSession(null), [])
  /** Log out lands on the card (or the opening) without a history step, so the phone's
   *  Back doesn't walk back through members-only screens. */
  const loggedOut = () => {
    setSession(null)
    history.replaceState(null, '', state.done ? '#/card' : '#/')
    setRoute(readRoute())
  }
  const deleted = (clearQuiz: boolean) => {
    setSession(null)
    if (clearQuiz) {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* storage blocked */
      }
      setState(fresh(true))
    }
    history.replaceState(null, '', clearQuiz || !state.done ? '#/' : '#/card')
    setRoute(readRoute())
  }
  const withBar = session && ['profile', 'settings', 'community', 'learn', 'lab'].includes(route.name)

  if (route.name === 'opening') {
    return <Opening onStart={start} skipToStart={state.seenOpening} onLogIn={canJoin && !session ? () => go('#/login') : undefined} />
  }
  if (MEMBERS_ONLY.has(route.name) && !authReady) {
    return <div className="app"><main className="screen"><p className="note" role="status">Loading…</p></main></div>
  }
  return (
    <div className={withBar ? 'app has-bar' : 'app'}>
      {isPreview() && <p className="preview-banner">Testing only: sign-ups aren’t open yet</p>}
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
          onJoin={join}
          onLogIn={canJoin && !session ? () => go('#/login') : undefined}
          onJustQuiz={() => go('#/tips')}
          onRetake={retake}
          onEdit={() => go('#/quiz/0')}
        />
      )}
      {route.name === 'tips' && <Tips state={state} onBack={() => goBack('#/card')} onRetake={retake} />}
      {route.name === 'soon' && <Soon onBack={() => goBack('#/card')} onTips={() => go('#/tips')} />}
      {route.name === 'join' && <Join go={go} onJoined={toProfile} />}
      {route.name === 'login' && <LogIn go={go} onLoggedIn={toProfile} note={loginNote} canJoin={canJoin} startForgot={loginForgot} />}
      {route.name === 'reset' && <NewPassword onDone={toProfile} />}
      {route.name === 'profile' && session && <Profile key={session.user.id} quiz={state} go={go} onSignedOut={signedOut} />}
      {route.name === 'settings' && session && <Settings onSignedOut={signedOut} onLoggedOut={loggedOut} onDeleted={deleted} />}
      {route.name === 'member' && <PublicProfile username={route.username} loggedIn={!!session} canJoin={canJoin} quizDone={state.done} go={go} />}
      {route.name === 'missing' && <NotFound quizDone={state.done} go={go} />}
      {(route.name === 'community' || route.name === 'learn' || route.name === 'lab') && <TabSoon tab={route.name} />}
      {route.name === 'legal' && <Legal doc={route.doc} onBack={() => goBack(session ? '#/settings' : canJoin ? '#/join' : '#/card')} />}
      {withBar && <BottomBar current={hashOf(route)} go={go} />}
    </div>
  )
}
