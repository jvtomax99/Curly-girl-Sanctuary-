// Profile rules in plain TypeScript, no React, so they can be tested.
// The server (supabase/migrations/0001_phase2.sql) is what enforces who sees what;
// these only shape what the app sends and how it shows what came back.
import { HERITAGE_FIXED, HERITAGE_REGIONS, NOT_SURE, QUESTIONS } from '../data/quiz'
import { cardRows, type CardRow } from './card'
import { fresh, type QuizState } from './state'

export type Visibility = 'only_me' | 'community' | 'everyone'
export type ItemId = 'card' | 'scalp' | 'heritage' | 'kit'

export const VISIBILITIES: { value: Visibility; label: string; note: string }[] = [
  { value: 'only_me', label: 'Only me', note: 'Just you.' },
  { value: 'community', label: 'Community', note: 'Members who are logged in.' },
  { value: 'everyone', label: 'Everyone', note: 'Anyone with the link, even without an account.' },
]

/** Where each item starts. Heritage is always Only me (the server enforces it too). */
export const DEFAULT_VISIBILITY: Record<ItemId, Visibility> = {
  card: 'community',
  scalp: 'community',
  heritage: 'only_me',
  kit: 'everyone',
}

export const ITEM_LABELS: Record<ItemId, string> = {
  card: 'Curly ID Card',
  scalp: 'Scalp type',
  heritage: 'Heritage',
  kit: 'Curl Kit',
}

export interface Item {
  item: ItemId
  value: Record<string, unknown>
  visibility: Visibility
}

// ------------------------------------------------------------------ usernames

/** "@Coily.Ana " becomes "coily.ana". */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase()
}

/** A message to show, or null when the username is fine. Same rule as the server. */
export function usernameProblem(raw: string): string | null {
  const u = normalizeUsername(raw)
  if (u.length < 3) return 'At least 3 characters.'
  if (u.length > 20) return 'At most 20 characters.'
  if (!/^[a-z0-9_.]+$/.test(u)) return 'Letters, numbers, _ and . only.'
  return null
}

// ------------------------------------------------------------------ quiz to profile

const optionValues = (id: string) => new Set(QUESTIONS.find((q) => q.id === id)?.options.map((o) => o.value) ?? [])
const HERITAGE_VALUES = new Set([...HERITAGE_FIXED, ...HERITAGE_REGIONS].map((o) => o.value))
const CARD_FIELDS = ['pattern', 'porosity', 'thickness', 'density'] as const

/** The profile items a finished quiz fills. Heritage only when something was picked
 *  (never for "Prefer not to say"), and always as Only me. The traditions note stays
 *  on the phone. */
export function itemsFromQuiz(s: QuizState): Item[] {
  const card: Record<string, string> = {}
  for (const f of CARD_FIELDS) {
    const v = s.answers[f]?.[0]
    if (v && optionValues(f).has(v)) card[f] = v
  }
  const items: Item[] = [{ item: 'card', value: card, visibility: DEFAULT_VISIBILITY.card }]
  const scalp = s.answers.scalp?.[0]
  if (scalp && optionValues('scalp').has(scalp)) {
    items.push({ item: 'scalp', value: { scalp }, visibility: DEFAULT_VISIBILITY.scalp })
  }
  const heritage = (s.answers.heritage ?? []).filter((v) => HERITAGE_VALUES.has(v))
  if (heritage.length > 0 && !heritage.includes('prefer-not')) {
    items.push({ item: 'heritage', value: { values: heritage }, visibility: 'only_me' })
  }
  return items
}

// ------------------------------------------------------------------ server to screen

const isVisibility = (v: unknown): v is Visibility => v === 'only_me' || v === 'community' || v === 'everyone'
const isItemId = (v: unknown): v is ItemId => v === 'card' || v === 'scalp' || v === 'heritage' || v === 'kit'

/** Keeps only well-formed rows from the server; anything odd is dropped, not shown. */
export function parseItems(rows: unknown): Item[] {
  if (!Array.isArray(rows)) return []
  const out: Item[] = []
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue
    const { item, value, visibility } = r as Record<string, unknown>
    if (!isItemId(item) || !isVisibility(visibility)) continue
    const v = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
    out.push({ item, value: v, visibility })
  }
  return out
}

/** The card rows for the items a viewer got back. A hidden item simply has no row. */
export function profileRows(items: Item[]): CardRow[] {
  const get = (id: ItemId) => items.find((i) => i.item === id)
  const card = get('card')
  const scalp = get('scalp')
  const heritage = get('heritage')
  const s = fresh()
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
  for (const f of CARD_FIELDS) {
    const v = str(card?.value[f])
    if (v && optionValues(f).has(v)) s.answers[f] = [v]
  }
  const sc = str(scalp?.value.scalp)
  if (sc && optionValues('scalp').has(sc)) s.answers.scalp = [sc]
  const hv = heritage?.value.values
  if (Array.isArray(hv)) {
    s.answers.heritage = hv.filter((v): v is string => typeof v === 'string' && HERITAGE_VALUES.has(v))
    s.showHeritage = true
  }
  return cardRows(s).filter((r) => {
    if (r.label === 'Scalp') return !!scalp
    if (r.label === 'Heritage') return !!heritage
    return !!card
  })
}

/** The owner's "See my profile as" preview for Community: what a member would get. */
export function visibleTo(viewer: 'community' | 'everyone', items: Item[]): Item[] {
  return items.filter((i) => i.visibility === 'everyone' || (viewer === 'community' && i.visibility === 'community'))
}

/** True when the card holds at least one real answer (not just "Not sure"). */
export function hasCard(items: Item[]): boolean {
  const card = items.find((i) => i.item === 'card')
  return !!card && Object.values(card.value).some((v) => typeof v === 'string' && v !== NOT_SURE)
}

