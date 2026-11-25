// The 10-question quiz: one question per screen, progress bar, Back, answers
// saved as the person goes (App saves every change).
import { useEffect, useRef } from 'react'
import { QUESTIONS, CURL_TYPES, NOT_SURE, type CurlType, type Question } from '../data/quiz'
import { SOURCES } from '../data/sources'
import { answered, choose, type QuizState } from '../engine/state'
import { canShowHeritage } from '../engine/card'
import CurlArt from './CurlArt'

interface Props {
  state: QuizState
  onChange: (s: QuizState) => void
  onBack: () => void
  onNext: () => void
}

export default function Quiz({ state, onChange, onBack, onNext }: Props) {
  const q = QUESTIONS[state.step]
  const picked = state.answers[q.id] ?? []
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the new question so screen readers announce it.
  useEffect(() => {
    titleRef.current?.focus()
  }, [state.step])

  const pick = (value: string) => onChange(choose(state, q.id, value))
  const isOn = (value: string) => picked.includes(value)
  const last = state.step === QUESTIONS.length - 1

  return (
    <main className="screen">
      <div className="quiz-top">
        <button className="btn-link" onClick={onBack} aria-label="Back">
          &#8592; Back
        </button>
        <span className="quiz-count" style={{ marginLeft: 'auto' }}>
          {state.step + 1} of {QUESTIONS.length}
        </span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={state.step + 1} aria-label="Quiz progress">
        <span style={{ width: `${((state.step + 1) / QUESTIONS.length) * 100}%` }} />
      </div>

      <h1 className="q-title" tabIndex={-1} ref={titleRef}>
        {q.title}
      </h1>
      {q.help && <p className="q-help">{q.help}</p>}
      {q.sources && <Sources ids={q.sources} />}

      {q.kind === 'curl' && <CurlGrid q={q} isOn={isOn} pick={pick} />}
      {q.kind === 'single' && (
        <div className="choices" role="group" aria-label={q.title}>
          {q.options.map((o) => (
            <button key={o.value} className="choice" aria-pressed={isOn(o.value)} onClick={() => pick(o.value)}>
              <span className="choice-label">{o.label}</span>
              {o.note && <span className="choice-note">{o.note}</span>}
            </button>
          ))}
        </div>
      )}
      {q.kind === 'multi' && (
        <div className="chips" role="group" aria-label={q.title}>
          {q.options.map((o) => (
            <button key={o.value} className="chip" aria-pressed={isOn(o.value)} onClick={() => pick(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {q.id === 'heritage' && (
        <>
          <label className="field">
            Optional: traditions you grew up with
            <textarea
              maxLength={300}
              value={state.traditionsNote}
              onChange={(e) => onChange({ ...state, traditionsNote: e.target.value })}
            />
          </label>
          <div className="switch-row">
            <span id="show-heritage">Show heritage on my card</span>
            <button
              className="switch"
              role="switch"
              aria-checked={state.showHeritage}
              aria-labelledby="show-heritage"
              disabled={!canShowHeritage(state)}
              onClick={() => onChange({ ...state, showHeritage: !state.showHeritage })}
            />
          </div>
        </>
      )}

      <div className="quiz-foot">
        <button className="btn btn-primary" disabled={!answered(state, q.id)} onClick={onNext}>
          {last ? 'See my Curly ID' : 'Next'}
        </button>
        {q.optional && picked.length === 0 && <span className="note">You can skip this one.</span>}
      </div>
    </main>
  )
}

function CurlGrid({ q, isOn, pick }: { q: Question; isOn: (v: string) => boolean; pick: (v: string) => void }) {
  return (
    <div className="curl-grid" role="group" aria-label={q.title}>
      {CURL_TYPES.map((t: CurlType) => (
        <button key={t} className="curl" aria-pressed={isOn(t)} onClick={() => pick(t)} aria-label={`Curl type ${t}`}>
          <CurlArt type={t} />
          <span className="curl-name">{t}</span>
        </button>
      ))}
      <button className="curl curl-unsure" aria-pressed={isOn(NOT_SURE)} onClick={() => pick(NOT_SURE)}>
        <span className="curl-name">Not sure</span>
      </button>
    </div>
  )
}

export function Sources({ ids }: { ids: string[] }) {
  return (
    <p className="q-sources">
      Sources:{' '}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ', '}
          <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">
            {SOURCES[id].by}
          </a>
        </span>
      ))}
    </p>
  )
}
