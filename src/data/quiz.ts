// The 9 quiz questions. Every word a person reads in the quiz lives here, so
// Susan's changes are text edits. Susan's edits of 2026-11-26: no "Not sure" on
// questions 1 to 4 and 7 (question 2 tells you how to check instead), her heritage
// list with a box to say more, wash without "less than once a week", struggles as
// select-all, "Growth" for length, and the traditions question removed.

export type Kind = 'curl' | 'single' | 'multi'

export interface Option {
  value: string
  label: string
  /** One short line under the label. */
  note?: string
}

export interface Question {
  id: QuestionId
  kind: Kind
  title: string
  /** A short line under the title. */
  help?: string
  options: Option[]
  /** May be left empty (Next works with no answer). */
  optional?: boolean
  /** Source ids from docs/sources.md behind the help or option notes. */
  sources?: string[]
}

export type QuestionId =
  | 'pattern'
  | 'porosity'
  | 'thickness'
  | 'density'
  | 'heritage'
  | 'wash'
  | 'scalp'
  | 'struggle'
  | 'goal'

/** No longer offered, but old saves (and old cards) may still hold it. */
export const NOT_SURE = 'not-sure'

export const CURL_TYPES = ['2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'] as const
export type CurlType = (typeof CURL_TYPES)[number]

// Heritage: Susan's list (2026-11-26), alphabetical, then Mixed and Prefer not to say.
export const HERITAGE_REGIONS: Option[] = [
  { value: 'african', label: 'African' },
  { value: 'black-american', label: 'Black American' },
  { value: 'black-caribbean', label: 'Black Caribbean' },
  { value: 'east-asian', label: 'East Asian' },
  { value: 'european', label: 'European' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'latin-american', label: 'Latin American' },
  { value: 'latin-caribbean', label: 'Latin Caribbean' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'north-african', label: 'North African' },
  { value: 'pacific-islander', label: 'Pacific Islander' },
  { value: 'south-asian', label: 'South Asian' },
  { value: 'southeast-asian', label: 'Southeast Asian' },
]
export const HERITAGE_FIXED: Option[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'prefer-not', label: 'Prefer not to say' },
]
/** Earlier choices no longer offered. Kept so old saves and profiles still show them,
 *  and the quiz shows one as a chip only while it is picked, so it can be taken off. */
export const HERITAGE_RETIRED: Option[] = [
  { value: 'not-sure-yet', label: 'Not sure yet' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'middle-eastern-north-african', label: 'Middle Eastern or North African' },
  { value: 'east-southeast-asian', label: 'East or Southeast Asian' },
]
export const HERITAGE_ALL: Option[] = [...HERITAGE_REGIONS, ...HERITAGE_FIXED, ...HERITAGE_RETIRED]

/** Shown under question 8 when "Hair loss" is picked (CLAUDE.md: hair loss points to a
 *  doctor, never to a product). */
export const HAIR_LOSS_NOTE = {
  text: 'Hair loss is a reason to see a board-certified dermatologist, not to switch products.',
  src: ['S5'],
}

export const QUESTIONS: Question[] = [
  {
    id: 'pattern',
    kind: 'curl',
    title: 'Which curl is closest to yours?',
    help: 'Pick the one that looks most like your hair when it dries on its own. Between two? Pick the one most of your hair looks like.',
    options: CURL_TYPES.map((t) => ({ value: t, label: t })),
  },
  {
    id: 'porosity',
    kind: 'single',
    title: 'How does your hair take in water?',
    help: 'Porosity is how well your hair takes in and holds water. To check, mist a section of clean hair with water. Beads of water that sit on top and a long dry time point to low. Water that soaks in fast and dries fast points to high. Home checks only give a rough idea, so go with what you usually notice.',
    sources: ['S1', 'S2'],
    options: [
      { value: 'low', label: 'Low', note: 'Takes a long time to get wet and to dry; products sit on top.' },
      { value: 'medium', label: 'Medium', note: 'Somewhere in between.' },
      { value: 'high', label: 'High', note: 'Soaks up water and dries quickly; often feels dry or frizzy.' },
    ],
  },
  {
    id: 'thickness',
    kind: 'single',
    title: 'How thick is a single strand?',
    help: 'Go with how one strand looks and feels to you.',
    options: [
      { value: 'fine', label: 'Fine', note: 'Very thin.' },
      { value: 'medium', label: 'Medium', note: 'In between.' },
      { value: 'coarse', label: 'Coarse', note: 'Thick.' },
    ],
  },
  {
    id: 'density',
    kind: 'single',
    title: 'How much scalp can you see?',
    help: 'Go with what you see at your roots. Your card calls this density.',
    options: [
      { value: 'low', label: 'Easy to see', note: 'Your card says Low density.' },
      { value: 'medium', label: 'A little', note: 'Your card says Medium density.' },
      { value: 'high', label: 'Hardly any', note: 'Your card says High density.' },
    ],
  },
  {
    id: 'heritage',
    kind: 'multi',
    title: 'Where does your hair story come from?',
    help: 'Select all that apply. This helps match what you learn. It is optional, and only you see it unless you choose to show it.',
    optional: true,
    options: [...HERITAGE_REGIONS, ...HERITAGE_FIXED],
  },
  {
    id: 'wash',
    kind: 'single',
    title: 'How often do you wash your hair?',
    options: [
      { value: 'daily', label: 'Every day' },
      { value: '2-3-week', label: '2 to 3 times a week' },
      { value: 'weekly', label: 'Once a week' },
    ],
  },
  {
    id: 'scalp',
    kind: 'single',
    title: 'How does your scalp usually feel?',
    help: 'A day or two after washing.',
    options: [
      { value: 'oily', label: 'Oily' },
      { value: 'balanced', label: 'Balanced' },
      { value: 'dry', label: 'Dry' },
    ],
  },
  {
    id: 'struggle',
    kind: 'multi',
    title: 'What are your hair struggles?',
    help: 'Select all that apply.',
    optional: true,
    options: [
      { value: 'frizz', label: 'Frizz' },
      { value: 'dryness', label: 'Dryness' },
      { value: 'tangles', label: 'Tangles a lot' },
      { value: 'breakage', label: 'Breakage' },
      { value: 'hair-loss', label: 'Hair loss' },
      { value: 'volume', label: 'Flat' },
      { value: 'definition', label: 'No definition' },
    ],
  },
  {
    id: 'goal',
    kind: 'single',
    title: 'What is your main hair goal?',
    options: [
      { value: 'moisture', label: 'Moisture' },
      { value: 'definition', label: 'Definition' },
      { value: 'length', label: 'Growth' },
      { value: 'volume', label: 'Volume' },
      { value: 'routine', label: 'An easier routine' },
      { value: 'love', label: 'Just loving my curls' },
    ],
  },
]

export const LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  fine: 'Fine',
  coarse: 'Coarse',
  oily: 'Oily',
  balanced: 'Balanced',
  dry: 'Dry',
  [NOT_SURE]: 'Not sure',
}
