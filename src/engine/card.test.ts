import { describe, expect, it } from 'vitest'
import { cardRows, group, heritageText, canShowHeritage } from './card'
import { choose, fresh, parse, answered, type QuizState } from './state'

function filled(extra: Partial<QuizState> = {}): QuizState {
  let s = fresh()
  s = choose(s, 'pattern', '3B')
  s = choose(s, 'porosity', 'medium')
  s = choose(s, 'thickness', 'fine')
  s = choose(s, 'density', 'medium')
  s = choose(s, 'scalp', 'balanced')
  s = choose(s, 'heritage', 'mixed')
  return { ...s, ...extra }
}

describe('Curly ID Card', () => {
  it('shows the five hair rows from the answers', () => {
    expect(cardRows(filled())).toEqual([
      { label: 'Hair type', value: '3B' },
      { label: 'Porosity', value: 'Medium' },
      { label: 'Thickness', value: 'Fine' },
      { label: 'Density', value: 'Medium' },
      { label: 'Scalp', value: 'Balanced' },
    ])
  })

  it('never shows heritage unless the switch is on', () => {
    expect(cardRows(filled()).some((r) => r.label === 'Heritage')).toBe(false)
    expect(cardRows(filled({ showHeritage: true })).at(-1)).toEqual({ label: 'Heritage', value: 'Mixed' })
  })

  it('never shows heritage for "Prefer not to say", even with the switch on', () => {
    const s = choose(filled(), 'heritage', 'prefer-not')
    expect(s.answers.heritage).toEqual(['prefer-not'])
    expect(s.showHeritage).toBe(false)
    expect(heritageText({ ...s, showHeritage: true })).toBeNull()
    expect(canShowHeritage(s)).toBe(false)
  })

  it('shows "Not sure" for unanswered or not-sure rows', () => {
    const s = choose(fresh(), 'pattern', 'not-sure')
    expect(cardRows(s).map((r) => r.value)).toEqual(['Not sure', 'Not sure', 'Not sure', 'Not sure', 'Not sure'])
    expect(group(s)).toBeNull()
  })

  it('groups types into wavy, curly and coily', () => {
    expect(group(choose(fresh(), 'pattern', '2C'))).toBe(2)
    expect(group(choose(fresh(), 'pattern', '3A'))).toBe(3)
    expect(group(choose(fresh(), 'pattern', '4C'))).toBe(4)
  })
})

describe('Saved quiz', () => {
  it('keeps one answer on single questions and toggles on multi', () => {
    let s = choose(fresh(), 'wash', 'daily')
    s = choose(s, 'wash', 'weekly')
    expect(s.answers.wash).toEqual(['weekly'])
    s = choose(s, 'heritage', 'african')
    s = choose(s, 'heritage', 'european')
    s = choose(s, 'heritage', 'african')
    expect(s.answers.heritage).toEqual(['european'])
  })

  it('treats heritage and traditions as optional, the rest as required', () => {
    expect(answered(fresh(), 'heritage')).toBe(true)
    expect(answered(fresh(), 'traditions')).toBe(true)
    expect(answered(fresh(), 'wash')).toBe(false)
  })

  it('survives broken or old saves', () => {
    expect(parse('not json')).toEqual(fresh())
    expect(parse(JSON.stringify({ v: 2 }))).toEqual(fresh())
    const s = parse(JSON.stringify({ v: 1, answers: { pattern: ['3B'], hacker: ['x'], wash: 'daily' }, step: 99, showHeritage: 'yes' }))
    expect(s.answers).toEqual({ pattern: ['3B'] })
    expect(s.step).toBe(9)
    expect(s.showHeritage).toBe(false)
  })

  it('round-trips a full save', () => {
    const s = filled({ step: 4, showHeritage: true, done: true, seenOpening: true, traditionsNote: 'Sunday wash day' })
    expect(parse(JSON.stringify(s))).toEqual(s)
  })
})
