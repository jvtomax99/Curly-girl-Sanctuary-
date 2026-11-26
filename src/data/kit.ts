// Every Curl Kit word: product types, the tools list and how I dry.
// Ids are stored on the server (products.kind, kit_tools.tool, the kit item's "dry"),
// so change a label freely but never an id. Stand-in lists until Susan's starter list.

export const PRODUCT_KINDS: { value: string; label: string }[] = [
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'co-wash', label: 'Co-wash' },
  { value: 'conditioner', label: 'Conditioner' },
  { value: 'deep-conditioner', label: 'Deep conditioner or mask' },
  { value: 'leave-in', label: 'Leave-in' },
  { value: 'cream', label: 'Cream' },
  { value: 'custard', label: 'Custard' },
  { value: 'gel', label: 'Gel' },
  { value: 'mousse', label: 'Mousse or foam' },
  { value: 'oil', label: 'Oil' },
  { value: 'butter', label: 'Butter' },
  { value: 'refresher', label: 'Refresher spray' },
  { value: 'scalp', label: 'Scalp care' },
  { value: 'other', label: 'Other' },
]

export const TOOLS: { value: string; label: string }[] = [
  { value: 'diffuser', label: 'Diffuser' },
  { value: 'wide-tooth-comb', label: 'Wide-tooth comb' },
  { value: 'detangling-brush', label: 'Detangling brush' },
  { value: 'styling-brush', label: 'Styling brush' },
  { value: 'microfiber-towel', label: 'Microfiber towel' },
  { value: 'cotton-tshirt', label: 'Cotton T-shirt' },
  { value: 'spray-bottle', label: 'Spray bottle' },
  { value: 'clips', label: 'Clips' },
  { value: 'satin-bonnet', label: 'Satin or silk bonnet' },
  { value: 'satin-pillowcase', label: 'Satin or silk pillowcase' },
  { value: 'satin-scrunchie', label: 'Satin scrunchie' },
  { value: 'hooded-dryer', label: 'Hooded dryer' },
  { value: 'steamer', label: 'Steamer' },
]

export type Dry = 'air' | 'diffuse' | 'both'

export const DRY: { value: Dry; label: string }[] = [
  { value: 'air', label: 'Air dry' },
  { value: 'diffuse', label: 'Diffuse' },
  { value: 'both', label: 'Both' },
]
