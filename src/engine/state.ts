// The quiz's saved state. It lives only on this phone (localStorage), never
// sent anywhere. Every read and write is inside try/catch: private windows and
// blocked storage must not break the quiz.
import { QUESTIONS, type QuestionId } from '../data/quiz'

export const KEY = 'cgs.quiz.v1'

export interface QuizState {
  v: 1
  answers: Partial<Record<QuestionId, string[]>>
  /** Index of the question the person is on (0 to 8). */
  step: number
  /** "Show heritage on my card": off unless the person turns it on. */
  showHeritage: boolean
  /** Optional "tell us more" box on the heritage question. Stays on this phone, never
   *  on the card or profile. (Named for the earlier "traditions" box; old saves keep it.) */
  traditionsNote: string
  done: boolean
  /** The opening has played once on this phone. */
  seenOpening: boolean
}

export function fresh(seenOpening = false): QuizState {
  return { v: 1, answers: {}, step: 0, showHeritage: false, traditionsNote: '', done: false, seenOpening }
}

export function parse(raw: string | null): QuizState {
  if (!raw) return fresh()
  try {
    const s = JSON.parse(raw)
    if (!s || s.v !== 1 || typeof s.answers !== 'object' || s.answers === null) return fresh()
    const ids = new Set(QUESTIONS.map((q) => q.id))
    const answers: QuizState['answers'] = {}
    for (const [k, val] of Object.entries(s.answers)) {
      if (ids.has(k as QuestionId) && Array.isArray(val)) {
        answers[k as QuestionId] = val.filter((x): x is string => typeof x === 'string')
      }
    }
    const step = Number.isInteger(s.step) ? Math.min(Math.max(s.step, 0), QUESTIONS.length - 1) : 0
    return {
      v: 1,
      answers,
      step,
      showHeritage: s.showHeritage === true,
      traditionsNote: typeof s.traditionsNote === 'string' ? s.traditionsNote.slice(0, 300) : '',
      done: s.done === true,
      seenOpening: s.seenOpening === true,
    }
  } catch {
    return fresh()
  }
}

export function load(): QuizState {
  try {
    return parse(localStorage.getItem(KEY))
  } catch {
    return fresh()
  }
}

export function save(s: QuizState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage blocked: the quiz still works for this visit */
  }
}

/** A question counts as answered when it has an answer or may be left empty. */
export function answered(s: QuizState, id: QuestionId): boolean {
  const q = QUESTIONS.find((x) => x.id === id)
  if (!q) return false
  return q.optional === true || (s.answers[id]?.length ?? 0) > 0
}

/** Picks an option. Single questions keep one answer; multi toggles. */
export function choose(s: QuizState, id: QuestionId, value: string): QuizState {
  const q = QUESTIONS.find((x) => x.id === id)
  if (!q) return s
  const now = s.answers[id] ?? []
  let next: string[]
  if (q.kind !== 'multi') next = [value]
  else if (now.includes(value)) next = now.filter((x) => x !== value)
  else if (value === 'prefer-not') next = ['prefer-not'] // "Prefer not to say" clears the rest
  else next = [...now.filter((x) => x !== 'prefer-not'), value]
  const out: QuizState = { ...s, answers: { ...s.answers, [id]: next } }
  // The switch never stays on without something to show: clearing every pick (or "Prefer
  // not to say") turns it off, so a later pick needs a fresh yes.
  if (id === 'heritage' && (next.length === 0 || next.includes('prefer-not'))) out.showHeritage = false
  return out
}
