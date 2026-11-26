// What the Curly ID Card shows. Plain TypeScript, no React, so it can be tested.
// Rule from the brief: heritage shows only if the person chose to show it.
import { HERITAGE_ALL, LABELS, NOT_SURE, CURL_TYPES, type CurlType } from '../data/quiz'
import type { QuizState } from './state'

export interface CardRow {
  label: string
  value: string
}

const one = (s: QuizState, id: keyof QuizState['answers']) => s.answers[id]?.[0]

export function hairType(s: QuizState): CurlType | null {
  const v = one(s, 'pattern')
  return v && (CURL_TYPES as readonly string[]).includes(v) ? (v as CurlType) : null
}

/** Wavy (2), curly (3) or coily (4), for the broad tips. Null when not sure. */
export function group(s: QuizState): 2 | 3 | 4 | null {
  const t = hairType(s)
  return t ? (Number(t[0]) as 2 | 3 | 4) : null
}

const show = (v: string | undefined) => (v ? (LABELS[v] ?? v) : 'Not sure')

export function heritageText(s: QuizState): string | null {
  const picked = s.answers.heritage ?? []
  if (!s.showHeritage || picked.length === 0 || picked.includes('prefer-not')) return null
  const names = picked.map((v) => HERITAGE_ALL.find((o) => o.value === v)?.label).filter((x): x is string => !!x)
  return names.length ? names.join(', ') : null
}

export function cardRows(s: QuizState): CardRow[] {
  const rows: CardRow[] = [
    { label: 'Hair type', value: hairType(s) ?? 'Not sure' },
    { label: 'Porosity', value: show(one(s, 'porosity')) },
    { label: 'Thickness', value: show(one(s, 'thickness')) },
    { label: 'Density', value: show(one(s, 'density')) },
    { label: 'Scalp', value: show(one(s, 'scalp')) },
  ]
  const h = heritageText(s)
  if (h) rows.push({ label: 'Heritage', value: h })
  return rows
}

/** The heritage switch can be turned on only with something worth showing. */
export function canShowHeritage(s: QuizState): boolean {
  const picked = s.answers.heritage ?? []
  return picked.length > 0 && !picked.includes('prefer-not')
}

export { NOT_SURE }
