import { describe, expect, it } from 'vitest'
import { choose, fresh, type QuizState } from './state'
import {
  DEFAULT_VISIBILITY,
  hasCard,
  itemsFromQuiz,
  normalizeUsername,
  parseItems,
  profileRows,
  usernameProblem,
  visibleTo,
  type Item,
} from './profile'

function quiz(extra: Partial<QuizState> = {}): QuizState {
  let s = fresh()
  s = choose(s, 'pattern', '4A')
  s = choose(s, 'porosity', 'high')
  s = choose(s, 'thickness', 'coarse')
  s = choose(s, 'density', 'high')
  s = choose(s, 'scalp', 'dry')
  s = choose(s, 'heritage', 'caribbean')
  s = choose(s, 'heritage', 'mixed')
  return { ...s, done: true, traditionsNote: 'Grandma’s oil', ...extra }
}

describe('curly username', () => {
  it('drops a leading @, spaces and capitals', () => {
    expect(normalizeUsername('  @Coily.Ana ')).toBe('coily.ana')
  })
  it('follows the same rule as the server', () => {
    expect(usernameProblem('ab')).toMatch(/3/)
    expect(usernameProblem('a'.repeat(21))).toMatch(/20/)
    expect(usernameProblem('curl girl')).toMatch(/only/)
    expect(usernameProblem('curl-girl')).toMatch(/only/)
    expect(usernameProblem('@Wavy_Bea.2')).toBeNull()
  })
})

describe('quiz answers to profile items', () => {
  it('fills card, scalp and heritage', () => {
    const items = itemsFromQuiz(quiz())
    expect(items.map((i) => i.item)).toEqual(['card', 'scalp', 'heritage'])
    expect(items[0].value).toEqual({ pattern: '4A', porosity: 'high', thickness: 'coarse', density: 'high' })
  })
  it('sends heritage as Only me even when the quiz switch was on', () => {
    const h = itemsFromQuiz(quiz({ showHeritage: true })).find((i) => i.item === 'heritage')
    expect(h?.visibility).toBe('only_me')
    expect(DEFAULT_VISIBILITY.heritage).toBe('only_me')
  })
  it('sends no heritage for "Prefer not to say" or no answer', () => {
    expect(itemsFromQuiz(choose(quiz(), 'heritage', 'prefer-not')).some((i) => i.item === 'heritage')).toBe(false)
    const none = { ...quiz(), answers: { ...quiz().answers, heritage: [] } }
    expect(itemsFromQuiz(none).some((i) => i.item === 'heritage')).toBe(false)
  })
  it('never sends the traditions note or unknown answers', () => {
    const odd = { ...quiz(), answers: { ...quiz().answers, porosity: ['<script>'] } }
    const items = itemsFromQuiz(odd)
    expect(JSON.stringify(items)).not.toContain('Grandma')
    expect(items[0].value).not.toHaveProperty('porosity')
  })
})

describe('what a viewer is shown', () => {
  const all: Item[] = [
    { item: 'card', value: { pattern: '4A', porosity: 'high', thickness: 'coarse', density: 'high' }, visibility: 'community' },
    { item: 'scalp', value: { scalp: 'dry' }, visibility: 'everyone' },
    { item: 'heritage', value: { values: ['mixed', 'caribbean'] }, visibility: 'only_me' },
  ]
  it('shows every row the server sent', () => {
    expect(profileRows(all)).toEqual([
      { label: 'Hair type', value: '4A' },
      { label: 'Porosity', value: 'High' },
      { label: 'Thickness', value: 'Coarse' },
      { label: 'Density', value: 'High' },
      { label: 'Scalp', value: 'Dry' },
      { label: 'Heritage', value: 'Mixed, Caribbean' },
    ])
  })
  it('has no row for an item the server held back', () => {
    expect(profileRows(all.filter((i) => i.item === 'scalp'))).toEqual([{ label: 'Scalp', value: 'Dry' }])
  })
  it('previews Community and Everyone correctly', () => {
    expect(visibleTo('community', all).map((i) => i.item)).toEqual(['card', 'scalp'])
    expect(visibleTo('everyone', all).map((i) => i.item)).toEqual(['scalp'])
  })
  it('drops malformed rows from the server', () => {
    expect(parseItems([{ item: 'card', visibility: 'public', value: {} }, { item: 'x', visibility: 'everyone' }, null, 'no'])).toEqual([])
    expect(parseItems('nope')).toEqual([])
    expect(parseItems([{ item: 'kit', visibility: 'everyone', value: null }])).toEqual([{ item: 'kit', visibility: 'everyone', value: {} }])
  })
  it('knows when the card is empty', () => {
    expect(hasCard(all)).toBe(true)
    expect(hasCard([{ item: 'card', value: { pattern: 'not-sure' }, visibility: 'community' }])).toBe(false)
    expect(hasCard([])).toBe(false)
  })
})
