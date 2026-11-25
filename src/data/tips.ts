// Broad tips on the quiz-only results. Every tip names its source (docs/sources.md).
// Grouped wavy (2), curly (3), coily (4); sources rarely go finer than that.
export interface Tip {
  text: string
  src: string
}

export const ALL_HAIR: Tip[] = [
  { text: 'Use conditioner after every shampoo.', src: 'S4' },
  { text: 'Dry gently: wrap your hair in a towel or let it air dry instead of rubbing.', src: 'S4' },
  { text: 'Go easy on heat tools, and use the lowest heat setting.', src: 'S4' },
  { text: 'Avoid wearing styles that pull on your hair often, and keep braids loose around your hairline.', src: 'S5' },
]

export const TIPS: Record<2 | 3 | 4, { title: string; intro: string; tips: Tip[] }> = {
  2: {
    title: 'Tips for wavy hair',
    intro: 'Good habits for every hair type. Wavy-only tips come once we find a source we trust.',
    tips: ALL_HAIR,
  },
  3: {
    title: 'Tips for curly hair',
    intro: 'From dermatologists, for curly and coily hair.',
    tips: [
      { text: 'Wash only when your hair needs it: washing curly hair too often can leave it dry and frizzy.', src: 'S3' },
      { text: 'Condition all of your hair, not just the ends.', src: 'S3' },
      { text: 'Detangle while your hair is wet, with your fingers or a wide-tooth comb, and skip brushing it dry.', src: 'S3' },
      { text: 'Before bed, gather your hair in a loose "pineapple" ponytail on top of your head or a loose braid.', src: 'S3' },
      { text: 'Keep braids and ponytails loose, especially around your hairline.', src: 'S5' },
    ],
  },
  4: {
    title: 'Tips for coily hair',
    intro: 'From dermatologists, for coily and tightly curled hair.',
    tips: [
      { text: 'Comb your hair while it is damp, using a wide-tooth comb.', src: 'S4' },
      { text: 'Condition all of your hair, not just the ends.', src: 'S3' },
      { text: 'Wash only when your hair needs it: washing too often can leave it dry and hard to manage.', src: 'S3' },
      { text: 'Before bed, try a loose "pineapple" ponytail on top of your head or a loose braid.', src: 'S3' },
      { text: 'Keep braids loose, especially around your hairline, and give your hair breaks from tight styles.', src: 'S5' },
    ],
  },
}

export const DOCTOR = {
  text: 'Itching, flaking or hair loss that doesn’t clear up is a reason to see a board-certified dermatologist, not to switch products.',
  src: ['S6', 'S5'],
}
