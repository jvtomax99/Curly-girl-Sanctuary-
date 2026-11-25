// The 10 quiz questions. Every word a person reads in the quiz lives here, so
// Susan's changes are text edits. Questions 8 to 10 and the heritage list are
// stand-ins until she approves them (SPEC.md, "Needed from Susan").

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
  | 'traditions'

export const NOT_SURE = 'not-sure'

export const CURL_TYPES = ['2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'] as const
export type CurlType = (typeof CURL_TYPES)[number]

// Stand-in heritage list, broad regions only, until Susan sends hers.
export const HERITAGE_FIXED: Option[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'not-sure-yet', label: 'Not sure yet' },
  { value: 'prefer-not', label: 'Prefer not to say' },
]
export const HERITAGE_REGIONS: Option[] = [
  { value: 'african', label: 'African' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'latin-american', label: 'Latin American' },
  { value: 'middle-eastern-north-african', label: 'Middle Eastern or North African' },
  { value: 'south-asian', label: 'South Asian' },
  { value: 'east-southeast-asian', label: 'East or Southeast Asian' },
  { value: 'european', label: 'European' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'pacific-islander', label: 'Pacific Islander' },
]

export const QUESTIONS: Question[] = [
  {
    id: 'pattern',
    kind: 'curl',
    title: 'Which curl is closest to yours?',
    help: 'Pick the one that looks most like your hair when it dries on its own.',
    options: [
      ...CURL_TYPES.map((t) => ({ value: t, label: t })),
      { value: NOT_SURE, label: 'Not sure' },
    ],
  },
  {
    id: 'porosity',
    kind: 'single',
    title: 'How does your hair take in water?',
    help: 'Porosity is how well your hair takes in and holds water. These are everyday clues, not a test, so "Not sure" is fine.',
    sources: ['S1', 'S2'],
    options: [
      { value: 'low', label: 'Low', note: 'Takes a long time to get wet and to dry; products sit on top.' },
      { value: 'medium', label: 'Medium', note: 'Somewhere in between.' },
      { value: 'high', label: 'High', note: 'Soaks up water and dries quickly; often feels dry or frizzy.' },
      { value: NOT_SURE, label: 'Not sure' },
    ],
  },
  {
    id: 'thickness',
    kind: 'single',
    title: 'How thick is a single strand?',
    help: 'Roll one strand between your fingers.',
    options: [
      { value: 'fine', label: 'Fine', note: 'Hard to feel at all.' },
      { value: 'medium', label: 'Medium', note: 'You can feel it, but only just.' },
      { value: 'coarse', label: 'Coarse', note: 'Easy to feel, like a thread.' },
      { value: NOT_SURE, label: 'Not sure' },
    ],
  },
  {
    id: 'density',
    kind: 'single',
    title: 'How much scalp can you see?',
    help: 'Look at your roots in a mirror with your hair dry.',
    options: [
      { value: 'low', label: 'Easy to see', note: 'Your card says Low density.' },
      { value: 'medium', label: 'A little', note: 'Your card says Medium density.' },
      { value: 'high', label: 'Hardly any', note: 'Your card says High density.' },
      { value: NOT_SURE, label: 'Not sure' },
    ],
  },
  {
    id: 'heritage',
    kind: 'multi',
    title: 'Where does your hair story come from?',
    help: 'Select all that apply. This helps match what you learn. It is optional, and only you see it unless you choose to show it.',
    optional: true,
    options: [...HERITAGE_FIXED, ...HERITAGE_REGIONS],
  },
  {
    id: 'wash',
    kind: 'single',
    title: 'How often do you wash your hair?',
    options: [
      { value: 'daily', label: 'Every day' },
      { value: '2-3-week', label: '2 to 3 times a week' },
      { value: 'weekly', label: 'Once a week' },
      { value: 'less', label: 'Less than once a week' },
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
      { value: NOT_SURE, label: 'Not sure' },
    ],
  },
  {
    id: 'struggle',
    kind: 'single',
    title: 'What is your biggest hair struggle?',
    options: [
      { value: 'frizz', label: 'Frizz' },
      { value: 'dryness', label: 'Dryness' },
      { value: 'definition', label: 'Curls that won’t hold' },
      { value: 'tangles', label: 'Tangles' },
      { value: 'breakage', label: 'Breakage' },
      { value: 'volume', label: 'Flat or no volume' },
    ],
  },
  {
    id: 'goal',
    kind: 'single',
    title: 'What is your main hair goal?',
    options: [
      { value: 'moisture', label: 'Moisture' },
      { value: 'definition', label: 'Definition' },
      { value: 'length', label: 'Length' },
      { value: 'volume', label: 'Volume' },
      { value: 'routine', label: 'An easier routine' },
      { value: 'love', label: 'Just loving my curls' },
    ],
  },
  {
    id: 'traditions',
    kind: 'multi',
    title: 'Which traditions are you curious to learn from?',
    help: 'Select any. Optional.',
    optional: true,
    options: [...HERITAGE_REGIONS, { value: 'all', label: 'Surprise me' }],
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
