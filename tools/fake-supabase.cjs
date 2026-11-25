// A tiny stand-in for Supabase's sign-in and data answers, played inside Playwright
// (page.route), so the member screens can be walked through without a real project.
// It copies the visibility rule from supabase/migrations/0001_phase2.sql for the
// screens' sake only: the real rules are tested on Postgres by tools/db-check.sh.
// Build the app with VITE_SUPABASE_URL=https://cgs-fake.supabase.co VITE_SUPABASE_KEY=fake.
const HOST = 'https://cgs-fake.supabase.co'

function fake() {
  const db = { users: [], profiles: [], members_private: [], profile_items: [], staff: [] }
  const tokens = new Map() // access token -> user id
  let n = 0
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

  const session = (u) => {
    const access = `tok-${u.id}-${n++}`
    tokens.set(access, u.id)
    return {
      access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `ref-${access}`, user: userJson(u),
    }
  }
  const userJson = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, user_metadata: u.meta, identities: [{ id: u.id }], created_at: new Date().toISOString() })
  const isMember = (uid) => !!uid && db.profiles.some((p) => p.id === uid)
  const canSee = (uid, owner, item) =>
    owner === uid || db.profile_items.some((i) => i.member === owner && i.item === item && (i.visibility === 'everyone' || (i.visibility === 'community' && isMember(uid))))

  // Row rules, as in the migration (only what the screens touch).
  const readable = {
    profiles: () => true,
    members_private: (uid, r) => r.id === uid,
    profile_items: (uid, r) => canSee(uid, r.member, r.item),
    staff: (uid, r) => r.member === uid,
  }

  function filters(url) {
    const out = []
    for (const [k, v] of url.searchParams) {
      if (['select', 'on_conflict', 'columns', 'order', 'limit'].includes(k)) continue
      const m = /^(eq|in)\.(.*)$/.exec(v)
      if (!m) continue
      const vals = m[1] === 'in' ? m[2].replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')) : [m[2]]
      out.push((r) => vals.includes(String(r[k])))
    }
    return (r) => out.every((f) => f(r))
  }

  async function handle(route) {
    const json = (status, body) =>
      route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    const req = route.request()
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    }
    const url = new URL(req.url())
    const path = url.pathname
    const auth = req.headers()['authorization'] ?? ''
    const uid = tokens.get(auth.replace(/^Bearer /, '')) ?? null
    let body = {}
    try { body = req.postDataJSON() ?? {} } catch { body = {} }

    // ---- sign-in server
    if (path === '/auth/v1/signup') {
      if (db.users.some((u) => u.email === body.email)) return json(200, { id: id(), email: body.email, identities: [] })
      const m = body.data ?? {}
      if (!m.age_ok || !m.guidelines_ok) return json(500, { msg: 'Database error saving new user' })
      const name = String(m.username ?? '').trim().toLowerCase()
      if (!/^[a-z0-9_.]{3,20}$/.test(name) || db.profiles.some((p) => p.username === name)) return json(500, { msg: 'Database error saving new user' })
      const u = { id: id(), email: body.email, password: body.password, meta: m }
      db.users.push(u)
      db.profiles.push({ id: u.id, username: name, avatar: 'curls-1' })
      db.members_private.push({ id: u.id, first_name: m.first_name, last_name: m.last_name })
      return json(200, session(u)) // like a project with email confirmation off
    }
    if (path === '/auth/v1/token') {
      const u = db.users.find((x) => x.email === body.email && x.password === body.password)
      return u ? json(200, session(u)) : json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' })
    }
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    if (path === '/auth/v1/user') {
      const u = db.users.find((x) => x.id === uid)
      return u ? json(200, userJson(u)) : json(401, { msg: 'not logged in' })
    }
    if (path === '/auth/v1/recover') return json(200, {})

    // ---- functions
    if (path === '/rest/v1/rpc/username_available') {
      return json(200, !db.profiles.some((p) => p.username === String(body.name).trim().toLowerCase()))
    }
    if (path === '/rest/v1/rpc/delete_my_account') {
      if (!uid) return json(401, { message: 'not logged in' })
      db.users = db.users.filter((u) => u.id !== uid)
      db.profiles = db.profiles.filter((p) => p.id !== uid)
      db.members_private = db.members_private.filter((p) => p.id !== uid)
      db.profile_items = db.profile_items.filter((p) => p.member !== uid)
      db.staff = db.staff.filter((p) => p.member !== uid)
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }

    // ---- tables
    const t = /^\/rest\/v1\/(\w+)$/.exec(path)?.[1]
    if (!t || !db[t]) return json(404, { message: `no table ${path}` })
    const match = filters(url)
    const accept = req.headers()['accept'] ?? ''
    const one = accept.includes('vnd.pgrst.object')
    const prefer = req.headers()['prefer'] ?? ''
    const method = req.method()

    if (method === 'GET' || method === 'HEAD') {
      const rows = db[t].filter((r) => readable[t](uid, r) && match(r))
      if (one) return rows.length === 1 ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'no rows', details: `${rows.length} rows` })
      return json(200, rows)
    }
    if (method === 'POST') {
      if (t !== 'profile_items') return json(403, { code: '42501', message: 'permission denied' })
      const rows = Array.isArray(body) ? body : [body]
      for (const r of rows) {
        if (r.member !== uid || !isMember(uid)) return json(403, { code: '42501', message: 'new row violates row-level security policy' })
        const exists = db.profile_items.some((i) => i.member === r.member && i.item === r.item)
        if (exists && prefer.includes('ignore-duplicates')) continue
        if (exists) return json(409, { code: '23505', message: 'duplicate key' })
        db.profile_items.push({ member: r.member, item: r.item, value: r.value ?? {}, visibility: r.item === 'heritage' ? 'only_me' : (r.visibility ?? 'only_me') })
      }
      return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' } })
    }
    if (method === 'PATCH') {
      const own = { profiles: 'id', members_private: 'id', profile_items: 'member' }[t]
      if (!own) return json(403, { code: '42501', message: 'permission denied' })
      if (t === 'profiles' && body.username && db.profiles.some((p) => p.username === body.username && p.id !== uid)) {
        return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' })
      }
      const rows = db[t].filter((r) => r[own] === uid && match(r))
      rows.forEach((r) => Object.assign(r, body))
      return prefer.includes('return=representation') ? json(200, rows) : route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    if (method === 'DELETE') {
      if (t !== 'profile_items') return json(403, { code: '42501', message: 'permission denied' })
      db.profile_items = db.profile_items.filter((r) => !(r.member === uid && match(r)))
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    return json(405, { message: 'not handled' })
  }

  return { db, handle }
}

/** Sends every request for the fake project to one shared stand-in. */
async function useFake(context, f = fake()) {
  await context.route(`${HOST}/**`, (route) => f.handle(route))
  return f
}

module.exports = { HOST, fake, useFake }
