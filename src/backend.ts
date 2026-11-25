// Talks to Supabase. Every rule about who may see what is on the server
// (supabase/migrations/0001_phase2.sql); this file only asks and passes answers on.
// Without the two build settings the app has no backend: "Join" keeps the
// coming-soon page and nothing here runs.
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { parseItems, type Item, type ItemId, type Visibility } from './engine/profile'

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
  if (m.includes('database error saving new user')) return 'That curly username was just taken. Try another.'
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
