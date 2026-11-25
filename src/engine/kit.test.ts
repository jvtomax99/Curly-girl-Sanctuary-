import { describe, expect, it } from 'vitest'
import {
  alreadyListed,
  dryOf,
  kitIsEmpty,
  membersLabel,
  newProductProblem,
  parseKitProducts,
  parseProducts,
  parseSuggestions,
  parseTools,
  productKey,
  searchable,
  shownToOthers,
} from './kit'

// Made-up brands only.
const cream = { id: 1, brand: 'Spiral Test Co', name: 'Hydra Curl Cream', kind: 'cream', status: 'approved' }
const flax = { id: 2, brand: 'Kitchen Test', name: 'Flax Gel', kind: 'gel', status: 'pending' }

describe('kit rows from the server', () => {
  it('keeps products with their pending flag', () => {
    const kit = parseKitProducts([{ product_id: 1, products: cream }, { product_id: 2, products: flax }])
    expect(kit).toEqual([
      { id: 1, brand: 'Spiral Test Co', name: 'Hydra Curl Cream', kind: 'cream', pending: false },
      { id: 2, brand: 'Kitchen Test', name: 'Flax Gel', kind: 'gel', pending: true },
    ])
  })
  it('leaves out a product the viewer may not see (comes back empty)', () => {
    expect(parseKitProducts([{ product_id: 2, products: null }, { product_id: 1, products: cream }])).toHaveLength(1)
  })
  it('drops odd rows and duplicates, and never throws', () => {
    expect(parseKitProducts(null)).toEqual([])
    expect(parseKitProducts([1, 'x', { products: { id: 'nope', brand: 'B', name: 'N' } }, { products: cream }, { products: cream }])).toHaveLength(1)
    expect(parseProducts([{ ...cream, brand: '  ' }])).toEqual([])
  })
  it('turns an unknown type into Other', () => {
    expect(parseProducts([{ ...cream, kind: 'sparkles' }])[0].kind).toBe('other')
  })
  it('reads suggestions with member counts, never negative', () => {
    const s = parseSuggestions([{ ...cream, members: 12 }, { ...flax, id: 3, members: -4 }])
    expect(s.map((x) => x.members)).toEqual([12, 0])
    expect(s.every((x) => !x.pending)).toBe(true)
  })
  it('keeps only tools on the list, in list order', () => {
    expect(parseTools([{ tool: 'satin-bonnet' }, { tool: 'flamethrower' }, { tool: 'diffuser' }])).toEqual(['diffuser', 'satin-bonnet'])
  })
  it('reads how I dry, ignoring anything else', () => {
    expect(dryOf({ item: 'kit', value: { dry: 'diffuse' }, visibility: 'everyone' })).toBe('diffuse')
    expect(dryOf({ item: 'kit', value: { dry: 'blowtorch' }, visibility: 'everyone' })).toBeNull()
    expect(dryOf(undefined)).toBeNull()
  })
})

describe('words', () => {
  it('counts members', () => {
    expect(membersLabel(0)).toBe('New')
    expect(membersLabel(1)).toBe('1 member')
    expect(membersLabel(12)).toBe('12 members')
  })
  it('needs two letters to search', () => {
    expect(searchable('h')).toBe(false)
    expect(searchable(' hy ')).toBe(true)
  })
})

describe('Add your own', () => {
  it('needs brand, name and a type from the list, within the server limits', () => {
    expect(newProductProblem({ brand: '', name: 'X', kind: 'gel' })).toMatch(/brand/)
    expect(newProductProblem({ brand: 'B', name: ' ', kind: 'gel' })).toMatch(/name/)
    expect(newProductProblem({ brand: 'B', name: 'N', kind: '' })).toMatch(/type/)
    expect(newProductProblem({ brand: 'B'.repeat(61), name: 'N', kind: 'gel' })).toMatch(/60/)
    expect(newProductProblem({ brand: 'B', name: 'N'.repeat(101), kind: 'gel' })).toMatch(/100/)
    expect(newProductProblem({ brand: 'Kitchen Test', name: 'Rice Water', kind: 'other' })).toBeNull()
  })
  it('spots a product already listed under almost the same words', () => {
    expect(productKey('Madeup Botanics', 'Hydrating Leave-In')).toBe(productKey(' madeup botanics', 'hydrating leave in'))
    const known = parseProducts([cream])
    expect(alreadyListed({ brand: 'spiral test co.', name: 'Hydra-Curl Cream', kind: 'cream' }, known)?.id).toBe(1)
    expect(alreadyListed({ brand: 'Spiral Test Co', name: 'Hydra Curl Gel', kind: 'gel' }, known)).toBeUndefined()
  })
})

describe('what others see', () => {
  it('hides the owner’s pending products from the preview', () => {
    const kit = { products: parseKitProducts([{ products: cream }, { products: flax }]), tools: [], dry: null }
    expect(shownToOthers(kit).products.map((p) => p.id)).toEqual([1])
  })
  it('knows an empty kit', () => {
    expect(kitIsEmpty({ products: [], tools: [], dry: null })).toBe(true)
    expect(kitIsEmpty({ products: [], tools: [], dry: 'air' })).toBe(false)
  })
})
