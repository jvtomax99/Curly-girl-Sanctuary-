// Curl Kit rules in plain TypeScript, no React, so they can be tested.
// The server decides who sees a kit and which products exist; these only check what
// the app sends and keep odd rows from the server off the screen.
import { DRY, PRODUCT_KINDS, TOOLS, type Dry } from '../data/kit'
import type { Item } from './profile'

export interface Product {
  id: number
  brand: string
  name: string
  kind: string
  /** Added by a member and not yet checked by a moderator: only they (and moderators) see it. */
  pending: boolean
}

export interface Suggestion extends Product {
  /** How many members have it in a kit that isn't Only me. A number, never who. */
  members: number
}

export interface Kit {
  products: Product[]
  tools: string[]
  dry: Dry | null
}

export const EMPTY_KIT: Kit = { products: [], tools: [], dry: null }

const KINDS = new Set(PRODUCT_KINDS.map((k) => k.value))
const TOOL_IDS = new Set(TOOLS.map((t) => t.value))
const DRY_IDS = new Set<string>(DRY.map((d) => d.value))

export const kindLabel = (kind: string) => PRODUCT_KINDS.find((k) => k.value === kind)?.label ?? 'Other'
export const toolLabel = (tool: string) => TOOLS.find((t) => t.value === tool)?.label ?? tool
export const dryLabel = (dry: Dry) => DRY.find((d) => d.value === dry)?.label ?? dry

/** "1 member", "12 members", or "New" when nobody shares it yet. */
export function membersLabel(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return 'New'
  return n === 1 ? '1 member' : `${n} members`
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function toProduct(p: unknown): Product | null {
  if (!p || typeof p !== 'object') return null
  const r = p as Record<string, unknown>
  const id = Number(r.id)
  const brand = str(r.brand).trim()
  const name = str(r.name).trim()
  if (!Number.isInteger(id) || id <= 0 || !brand || !name) return null
  return { id, brand, name, kind: KINDS.has(str(r.kind)) ? str(r.kind) : 'other', pending: r.status === 'pending' }
}

/** Rows of kit_products with their product embedded. A product this viewer may not see
 *  (someone else's pending one) comes back empty and is left out. */
export function parseKitProducts(rows: unknown): Product[] {
  if (!Array.isArray(rows)) return []
  const out: Product[] = []
  for (const r of rows) {
    const p = toProduct(r && typeof r === 'object' ? (r as Record<string, unknown>).products : null)
    if (p && !out.some((o) => o.id === p.id)) out.push(p)
  }
  return out
}

/** Plain product rows (the moderator's queue). */
export function parseProducts(rows: unknown): Product[] {
  if (!Array.isArray(rows)) return []
  return rows.map(toProduct).filter((p): p is Product => !!p)
}

/** Rows from search_products. */
export function parseSuggestions(rows: unknown): Suggestion[] {
  if (!Array.isArray(rows)) return []
  const out: Suggestion[] = []
  for (const r of rows) {
    const p = toProduct(r)
    if (!p) continue
    const m = Number((r as Record<string, unknown>).members)
    out.push({ ...p, pending: false, members: Number.isFinite(m) && m > 0 ? Math.floor(m) : 0 })
  }
  return out
}

/** Tools from the server, only ones on the list, in the list's order. */
export function parseTools(rows: unknown): string[] {
  if (!Array.isArray(rows)) return []
  const have = new Set(rows.map((r) => (r && typeof r === 'object' ? str((r as Record<string, unknown>).tool) : '')))
  return TOOLS.map((t) => t.value).filter((t) => have.has(t))
}

/** How I dry, from the kit item's value. */
export function dryOf(kit: Item | undefined): Dry | null {
  const d = kit?.value.dry
  return typeof d === 'string' && DRY_IDS.has(d) ? (d as Dry) : null
}

export const isTool = (t: string) => TOOL_IDS.has(t)
export const isDry = (d: unknown): d is Dry => typeof d === 'string' && DRY_IDS.has(d)

/** Search needs at least two letters (the server says the same). */
export const searchable = (q: string) => q.trim().length >= 2

/** Brand and name with case, spaces and punctuation ignored: "Hydrating Leave-In" and
 *  "hydrating leave in" are the same product. */
export function productKey(brand: string, name: string): string {
  const k = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '')
  return `${k(brand)}|${k(name)}`
}

export interface NewProduct {
  brand: string
  name: string
  kind: string
}

/** A message to show, or null when "Add your own" can be sent. Same limits as the server. */
export function newProductProblem(p: NewProduct): string | null {
  const brand = p.brand.trim()
  const name = p.name.trim()
  if (!brand) return 'Add the brand.'
  if (!name) return 'Add the product name.'
  if (brand.length > 60) return 'The brand can be at most 60 characters.'
  if (name.length > 100) return 'The product name can be at most 100 characters.'
  if (!KINDS.has(p.kind)) return 'Pick a type.'
  return null
}

/** A product already listed under (almost) the same brand and name, if any. */
export function alreadyListed(p: NewProduct, known: Product[]): Product | undefined {
  const key = productKey(p.brand, p.name)
  return known.find((k) => productKey(k.brand, k.name) === key)
}

/** What others get: someone else's pending product never shows (the server already
 *  leaves it out; the owner's "See as" preview uses this to match). */
export const shownToOthers = (kit: Kit): Kit => ({ ...kit, products: kit.products.filter((p) => !p.pending) })

export const kitIsEmpty = (kit: Kit) => kit.products.length === 0 && kit.tools.length === 0 && !kit.dry
