// Talks to Supabase. Every rule about who may see what is on the server
// (supabase/migrations/0001_phase2.sql); this file only asks and passes answers on.
// Without the two build settings the app has no backend: "Join" keeps the
// coming-soon page and nothing here runs.
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_VISIBILITY, parseItems, type Item, type ItemId, type Visibility } from './engine/profile'
import { dryOf, parseKitProducts, parseProducts, parseSuggestions, parseTools, type Kit, type NewProduct, type Product, type Suggestion } from './engine/kit'
import type { Dry } from './data/kit'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_KEY as string | undefined

/** The session lives in this app's own storage key. Other apps share this address
 *  (jvtomax99.github.io), so the name must not clash with theirs. */
export const sb: SupabaseClient | null =
  URL_ && KEY
    ? createClient(URL_, KEY, {
        auth: { flowType: 'pkce', storageKey: 'cgs.auth', persistSession: true, detectSessionInUrl: true },
      })
    : null

/** A second connection that is never logged in: "See my profile as Everyone" asks the
 *  server as a visitor would, so the preview is the server's answer, not a guess. */
const visitor: SupabaseClient | null =
  URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'cgs.visitor' } }) : null

export const POLICY_VERSION = 'draft-2026-11'
/** Stand-in until Jose and Susan set the minimum age (SPEC.md, "Decisions waiting" 7). */
export const MIN_AGE = 16

const PREVIEW_KEY = 'cgs.preview'

/** Sign-ups stay closed on the live app until Susan's policy, terms, guidelines and the
 *  minimum age exist. "#/preview" opens them on one phone for testing. */
export function signupsOpen(): boolean {
  if (!sb) return false
  if (import.meta.env.VITE_SIGNUPS_OPEN === 'true') return true
  try {
    return localStorage.getItem(PREVIEW_KEY) === '1'
  } catch {
    return false
  }
}
export function isPreview(): boolean {
  return import.meta.env.VITE_SIGNUPS_OPEN !== 'true' && signupsOpen()
}
export function setPreview(on: boolean): void {
  try {
    if (on) localStorage.setItem(PREVIEW_KEY, '1')
    else localStorage.removeItem(PREVIEW_KEY)
  } catch {
    /* storage blocked: preview can't be remembered */
  }
}

/** Where email links come back to: this app's own folder page. */
const home = () => location.origin + location.pathname

type Result = { ok: true } | { ok: false; error: string }
const fail = (error: string): Result => ({ ok: false, error })
const OFFLINE = 'No connection. Try again when you’re online.'

/** Supabase's messages, in the app's words. */
function friendly(message: string | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) return 'That email already has an account. Try logging in.'
  // The server refuses sign-ups for a taken username, or while sign-ups aren't open.
  if (m.includes('database error saving new user')) return 'Couldn’t create the account: the curly username may have just been taken, or sign-ups aren’t open for this email yet.'
  if (m.includes('invalid login')) return 'That email and password don’t match.'
  if (m.includes('email not confirmed')) return 'Check your email first: tap the link we sent to finish joining.'
  if (m.includes('password') && (m.includes('least') || m.includes('weak') || m.includes('short'))) return 'Pick a longer password (at least 8 characters).'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a few minutes and try again.'
  if (m.includes('fetch') || m.includes('network')) return OFFLINE
  return 'Something went wrong. Try again in a moment.'
}

// ------------------------------------------------------------------ account

export interface JoinForm {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
}

export async function join(f: JoinForm): Promise<Result & { needsEmail?: boolean }> {
  if (!sb) return fail('Not open yet.')
  try {
    const { data, error } = await sb.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: home(),
        data: {
          first_name: f.firstName.trim(),
          last_name: f.lastName.trim(),
          username: f.username,
          age_ok: true,
          guidelines_ok: true,
          policy_version: POLICY_VERSION,
        },
      },
    })
    if (error) return fail(friendly(error.message))
    // An email that already has an account comes back with no identities.
    if (data.user && data.user.identities?.length === 0) return fail(friendly('already registered'))
    return { ok: true, needsEmail: !data.session }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function usernameAvailable(name: string): Promise<boolean | null> {
  if (!sb) return null
  try {
    const { data, error } = await sb.rpc('username_available', { name })
    return error ? null : data === true
  } catch {
    return null
  }
}

export async function logIn(email: string, password: string): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function logOut(): Promise<void> {
  try {
    await sb?.auth.signOut({ scope: 'local' })
  } catch {
    /* the local session is cleared either way */
  }
}

export async function sendReset(email: string): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: home() + '?reset=1' })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function setPassword(password: string): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.auth.updateUser({ password })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function deleteAccount(): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.rpc('delete_my_account')
    if (error) return fail(friendly(error.message))
    await logOut()
    return { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function currentSession(): Promise<Session | null> {
  if (!sb) return null
  try {
    return (await sb.auth.getSession()).data.session
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ profile

export interface MyProfile {
  id: string
  username: string
  avatar: string
  firstName: string
  lastName: string
  items: Item[]
  staff: boolean
}

export async function loadMyProfile(): Promise<MyProfile | 'offline' | null> {
  if (!sb) return null
  try {
    const session = await currentSession()
    if (!session) return null
    const id = session.user.id
    const [p, n, i, s] = await Promise.all([
      sb.from('profiles').select('username, avatar').eq('id', id).maybeSingle(),
      sb.from('members_private').select('first_name, last_name').eq('id', id).maybeSingle(),
      sb.from('profile_items').select('item, value, visibility').eq('member', id),
      sb.from('staff').select('role').eq('member', id).maybeSingle(),
    ])
    if (p.error || i.error) return 'offline'
    if (!p.data) return null
    return {
      id,
      username: p.data.username,
      avatar: p.data.avatar,
      firstName: n.data?.first_name ?? '',
      lastName: n.data?.last_name ?? '',
      items: parseItems(i.data),
      staff: !!s.data,
    }
  } catch {
    return 'offline'
  }
}

/** First visit after joining: the quiz answers on this phone fill the profile.
 *  Items already on the server are left alone. */
export async function addItems(member: string, items: Item[]): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const rows = items.map((i) => ({ member, item: i.item, value: i.value, visibility: i.visibility }))
    const { error } = await sb.from('profile_items').upsert(rows, { onConflict: 'member,item', ignoreDuplicates: true })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

/** After retaking the quiz: new answers, same audiences. A new item starts at its
 *  default (heritage as Only me). Items the new answers no longer have are removed. */
export async function replaceAnswers(member: string, items: Item[], had: Item[]): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    for (const it of items) {
      if (had.some((h) => h.item === it.item)) {
        const { error } = await sb.from('profile_items').update({ value: it.value, updated_at: new Date().toISOString() }).eq('member', member).eq('item', it.item)
        if (error) return fail(friendly(error.message))
      }
    }
    const fresh = items.filter((it) => !had.some((h) => h.item === it.item))
    if (fresh.length) {
      const r = await addItems(member, fresh)
      if (!r.ok) return r
    }
    const gone = had.filter((h) => h.item !== 'kit' && !items.some((it) => it.item === h.item)).map((h) => h.item)
    if (gone.length) {
      const { error } = await sb.from('profile_items').delete().eq('member', member).in('item', gone)
      if (error) return fail(friendly(error.message))
    }
    return { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function setVisibility(member: string, item: ItemId, visibility: Visibility): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { data, error } = await sb.from('profile_items').update({ visibility }).eq('member', member).eq('item', item).select('item')
    if (error) return fail(friendly(error.message))
    if (!data?.length) {
      // No row yet (an empty Curl Kit): make one, then set it.
      const { error: e2 } = await sb.from('profile_items').insert({ member, item, visibility })
      if (e2) return fail(friendly(e2.message))
      if (item === 'heritage' && visibility !== 'only_me') return setVisibility(member, item, visibility)
    }
    return { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function saveAccount(member: string, f: { username: string; avatar: string; firstName: string; lastName: string }): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const p = await sb.from('profiles').update({ username: f.username, avatar: f.avatar }).eq('id', member)
    if (p.error) return fail(p.error.code === '23505' ? 'That curly username is taken. Try another.' : friendly(p.error.message))
    const n = await sb.from('members_private').update({ first_name: f.firstName.trim(), last_name: f.lastName.trim() }).eq('id', member)
    return n.error ? fail(friendly(n.error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export interface PublicProfile {
  username: string
  avatar: string
  items: Item[]
}

/** Someone's profile as the server lets this viewer see it. `asVisitor` asks without
 *  being logged in, for "See my profile as Everyone". */
export async function loadPublicProfile(username: string, asVisitor = false): Promise<PublicProfile | 'offline' | null> {
  const c = asVisitor ? visitor : sb
  if (!c) return null
  try {
    const p = await c.from('profiles').select('id, username, avatar').eq('username', username.toLowerCase()).maybeSingle()
    if (p.error) return 'offline'
    if (!p.data) return null
    const i = await c.from('profile_items').select('item, value, visibility').eq('member', p.data.id)
    if (i.error) return 'offline'
    return { username: p.data.username, avatar: p.data.avatar, items: parseItems(i.data) }
  } catch {
    return 'offline'
  }
}

// ------------------------------------------------------------------ Curl Kit

const KIT_SELECT = 'product_id, added_at, products(id, brand, name, kind, status)'

/** A member's kit as the server lets this viewer see it: everything for the owner,
 *  nothing when the kit's audience leaves this viewer out. */
async function readKit(c: SupabaseClient, member: string): Promise<Kit | 'offline'> {
  const [p, t, i] = await Promise.all([
    c.from('kit_products').select(KIT_SELECT).eq('member', member).order('added_at'),
    c.from('kit_tools').select('tool').eq('member', member),
    c.from('profile_items').select('item, value, visibility').eq('member', member).eq('item', 'kit'),
  ])
  if (p.error || t.error || i.error) return 'offline'
  return { products: parseKitProducts(p.data), tools: parseTools(t.data), dry: dryOf(parseItems(i.data)[0]) }
}

export async function loadMyKit(member: string): Promise<Kit | 'offline'> {
  if (!sb) return 'offline'
  try {
    return await readKit(sb, member)
  } catch {
    return 'offline'
  }
}

export interface MemberKit {
  id: string
  username: string
  avatar: string
  /** null: this viewer isn't in the kit's audience (the server sent nothing). */
  kit: Kit | null
}

/** A shared kit link (#/u/<username>/kit). `asVisitor` asks without being logged in. */
export async function loadMemberKit(username: string, asVisitor = false): Promise<MemberKit | 'offline' | null> {
  const c = asVisitor ? visitor : sb
  if (!c) return null
  try {
    const p = await c.from('profiles').select('id, username, avatar').eq('username', username.toLowerCase()).maybeSingle()
    if (p.error) return 'offline'
    if (!p.data) return null
    const i = await c.from('profile_items').select('item, value, visibility').eq('member', p.data.id).eq('item', 'kit')
    if (i.error) return 'offline'
    const base = { id: p.data.id as string, username: p.data.username, avatar: p.data.avatar }
    if (!parseItems(i.data).length) return { ...base, kit: null }
    const kit = await readKit(c, p.data.id)
    return kit === 'offline' ? 'offline' : { ...base, kit }
  } catch {
    return 'offline'
  }
}

/** The kit's own row (its audience and how I dry). Made the first time something goes
 *  in the kit, at the kit's default audience; an existing row is left alone. */
async function ensureKitItem(member: string): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  const { error } = await sb
    .from('profile_items')
    .upsert({ member, item: 'kit', visibility: DEFAULT_VISIBILITY.kit }, { onConflict: 'member,item', ignoreDuplicates: true })
  return error ? fail(friendly(error.message)) : { ok: true }
}

export async function searchProducts(q: string): Promise<Suggestion[] | 'offline'> {
  if (!sb) return 'offline'
  try {
    const { data, error } = await sb.rpc('search_products', { q })
    return error ? 'offline' : parseSuggestions(data)
  } catch {
    return 'offline'
  }
}

export async function addToKit(member: string, productId: number): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const k = await ensureKitItem(member)
    if (!k.ok) return k
    const { error } = await sb.from('kit_products').upsert({ member, product_id: productId }, { onConflict: 'member,product_id', ignoreDuplicates: true })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function removeFromKit(member: string, productId: number): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.from('kit_products').delete().eq('member', member).eq('product_id', productId)
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

/** "Add your own": a new product, waiting for a moderator (only this member sees it
 *  until then), straight into their kit. */
export async function addOwnProduct(member: string, p: NewProduct): Promise<Result & { product?: Product }> {
  if (!sb) return fail('Not open yet.')
  try {
    const { data, error } = await sb
      .from('products')
      .insert({ brand: p.brand.trim(), name: p.name.trim(), kind: p.kind, added_by: member })
      .select('id, brand, name, kind, status')
    if (error) return fail(friendly(error.message))
    const product = parseProducts(data)[0]
    if (!product) return fail(friendly(''))
    const r = await addToKit(member, product.id)
    return r.ok ? { ok: true, product } : r
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export async function setTool(member: string, tool: string, on: boolean): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    if (!on) {
      const { error } = await sb.from('kit_tools').delete().eq('member', member).eq('tool', tool)
      return error ? fail(friendly(error.message)) : { ok: true }
    }
    const k = await ensureKitItem(member)
    if (!k.ok) return k
    const { error } = await sb.from('kit_tools').upsert({ member, tool }, { onConflict: 'member,tool', ignoreDuplicates: true })
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

/** How I dry, kept in the kit's own row; null clears it. */
export async function setDry(member: string, dry: Dry | null): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const k = await ensureKitItem(member)
    if (!k.ok) return k
    const { error } = await sb
      .from('profile_items')
      .update({ value: dry ? { dry } : {}, updated_at: new Date().toISOString() })
      .eq('member', member)
      .eq('item', 'kit')
    return error ? fail(friendly(error.message)) : { ok: true }
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

// ------------------------------------------------------------------ moderators

/** Products members added that wait for a check, oldest first. The server sends them
 *  only to moderators. Who added each one is never shown. */
export async function pendingProducts(): Promise<Product[] | 'offline'> {
  if (!sb) return 'offline'
  try {
    const { data, error } = await sb
      .from('products')
      .select('id, brand, name, kind, status')
      .eq('status', 'pending')
      .is('merged_into', null)
      .order('created_at')
    return error ? 'offline' : parseProducts(data)
  } catch {
    return 'offline'
  }
}

async function staffCall(fn: string, args: Record<string, number>): Promise<Result> {
  if (!sb) return fail('Not open yet.')
  try {
    const { error } = await sb.rpc(fn, args)
    if (!error) return { ok: true }
    const m = error.message ?? ''
    if (m.includes('moderators only')) return fail('Only moderators can do that.')
    if (m.includes('must be approved')) return fail('The one to keep must be an approved product.')
    if (m.includes('two different')) return fail('Pick two different products.')
    if (m.includes('waiting for a check')) return fail('Only a product waiting for a check can be turned down.')
    return fail(friendly(m))
  } catch (e) {
    return fail(friendly(String(e)))
  }
}

export const approveProduct = (id: number) => staffCall('approve_product', { product: id })
export const turnDownProduct = (id: number) => staffCall('turn_down_product', { product: id })
/** Every kit with the duplicate moves to the kept product; the duplicate stops showing. */
export const mergeProducts = (duplicate: number, kept: number) => staffCall('merge_products', { duplicate, kept })
