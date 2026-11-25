# Phase 2 plan (approved by Jose, 2026-11-25)

## Context

Phase 1 (quiz, Curly ID Card, tips) is live with no server. Jose picked Supabase
(2026-11-25), Resend free for sign-up emails, avatar only in Phase 2 (photo uploads
wait for Phase 4 with moderation), and the app-store question waits for Phase 6.
Phase 2 adds what "Join the Sanctuary" needs: an account, a profile where each item has
its own audience, a Curl Kit, and delete account. **Who it's for:** curly people who
finished the quiz and want to keep their card and share their kit.

**Built but not opened to the public.** The live app keeps "Join" on the coming-soon
page until Susan supplies the privacy policy, terms, community guidelines and the
minimum age, and Resend has a sending domain. Testing uses a hidden `#/preview` link
that shows a "Testing only" banner, with made-up accounts.

## How similar apps do it, and where ours is better

- **Strava:** separate settings for profile page (Everyone, Followers), activities
  (Everyone, Followers, Only You), heart rate, training log and more; most default to
  Everyone; name and bio are always visible (support.strava.com, "profile page privacy
  controls" and "privacy defaults").
- **Letterboxd:** each diary entry or review has its own privacy (Anyone, Close Friends,
  You, or the account default), but profile sections don't (letterboxd.com/about/faq).
- **Ours does better on three things:** every profile item has its own setting next to
  the item itself, not deep in Settings. Heritage starts as Only me, where Strava starts
  most things at Everyone. A "See my profile as: Everyone / Community" preview shows
  exactly what others get. The server checks every rule, not just the screen.

## What the person gets

1. **Join** (`#/join`): first name, last name, email, curly username, password, a
   minimum-age box and "I accept the community guidelines" (links to guidelines, privacy
   policy and terms). A verification email arrives (Resend through Supabase). The link
   opens the app logged in.
2. **Log in, log out, forgot password, reset password.** Add "Already a member? Log in"
   on the opening and the card screen (SPEC decision 5, suggested).
3. **First profile setup:** the quiz answers on the phone (`cgs.quiz.v1`) fill the
   card, scalp type and heritage. Each item shows its audience control (Only me,
   Community, Everyone). Heritage starts as Only me even when the quiz's "show heritage"
   switch was on; the switch carries over only as a highlighted prompt to change it.
4. **Profile** (`#/profile`, and others see `#/u/<username>`): default curly avatar
   (stand-in art, several skin tones, until Susan's), @curlyname, Curly ID Card rows
   (reusing `cardRows` from `src/engine/card.ts`), scalp type, heritage and Curl Kit,
   each only if the viewer is allowed. Edit profile, Share link, "See my profile as".
   First and last name are never shown to other people in Phase 2.
5. **Curl Kit** (`#/kit`, shared as `#/u/<username>/kit`): go-to products typed with
   suggestions ("hyd" lists matching products with how many members use each), "Add
   your own" (brand, name, type), tools from a list, how I dry (air dry, diffuse, both).
   Everything optional. A product someone adds is visible only to them until a
   moderator approves it. Moderator page (`#/admin/products`): approve, and merge two
   duplicates so every kit moves to the kept one.
6. **Delete account** (Profile, Settings): type your curly username to confirm. It
   removes the account, profile, kit and answers on the server, and offers to clear the
   quiz on this phone too.
7. **Bottom bar:** Community, Learn, Curl Lab (each "coming soon"), Profile.

## What it will NOT do in Phase 2

Photo uploads (Phase 4, with moderation); posts, comments, reviews; "Email my results"
(needs a server function, after Phase 2); follows, messages, notifications; Google or
Apple sign-in; changing your email; Curl Lab; opening sign-ups to the public; any
analytics. Heritage and health answers never feed anything but the person's own profile.

## How it's built

**Server (Supabase).** One SQL file, `supabase/migrations/0001_phase2.sql`, which Jose
pastes once into the SQL editor of each project:
- `members_private` (first and last name, age and guidelines accepted dates, policy
  version): owner only.
- `profiles` (curly username, unique, 3 to 20 letters, numbers, `_` or `.`; avatar
  choice): readable by all, since the username is what a shared link shows.
- `profile_items` (member, item: card, scalp, heritage, kit; value; visibility: only_me,
  community, everyone). Heritage defaults to only_me in the database itself. Every
  per-item rule lives here, one row per item, which suits Supabase's per-row rules:
  owner always; `everyone` for anyone; `community` for anyone logged in.
- `products` (brand, name, type, status approved or pending, added by, merged into),
  `kit_products`, `kit_tools`. Kit rows are readable only when the owner's `kit` item
  allows the viewer (one shared check function, `can_see(owner, item)`).
- `staff` (owner or moderator), filled by hand by Jose. `merge_products` and
  `approve_product` refuse anyone not in it.
- `search_products(text)` returns approved products with member counts (counts only,
  never who).
- `delete_my_account()` deletes the caller's sign-in, and every table above is set to
  delete with it.

**Two Supabase projects** (the free plan allows two): `cgs-test` with email
confirmation off, so automated checks can sign up made-up people freely, and `cgs-live`
with confirmation on and Resend set up. If Jose already uses a free Supabase project
elsewhere, we use one project and a test switch instead.

**App.** Adds `@supabase/supabase-js` (the one new package), with sign-in links using
the code-in-address flow so they work with the app's `#/` addresses.
- New: `src/backend.ts` (connects, and with no settings says "no backend" so the build,
  checks and current live app keep working unchanged).
- New: `src/engine/profile.ts`, plain TypeScript: username rules, quiz answers to
  profile items, visibility labels and defaults. Tests in `src/engine/profile.test.ts`.
- New screens in `src/components/`: Join, LogIn, ResetPassword, ProfileSetup, Profile,
  EditProfile, CurlKit, AdminProducts, Settings, BottomBar.
- `src/App.tsx`: the new `#/` addresses, using the existing `go` and `goBack` so the
  phone's Back keeps working.
- `src/styles.css`: new sections following `DESIGN.md` (contrast pairs, 44 px taps,
  16 px inputs, reduce motion).
- Settings: the project address and public key go in GitHub repo variables, read at
  build time by `.github/workflows/pages.yml`. The public key is made to sit in the
  browser; the server rules are what protect data. The Resend key goes only in
  Supabase's email settings and never in the repo or chat.
- `public/sw.js`: unchanged. It already ignores requests outside the app's folder, so
  it never caches Supabase answers. Signed-in screens say "needs a connection" offline.

**Two pull requests**, so each is small enough to check: **2a** accounts, profile,
visibility, delete account, settings; **2b** Curl Kit and the moderator product page.

## What Jose does (one copy-paste block each, `YOUR_VALUE_HERE` for secrets)

1. Make a Supabase account and the two projects; paste the SQL file in each.
2. In each project's Auth settings: the site address and allowed redirect
   `https://jvtomax99.github.io/Curly-girl-Sanctuary-/`.
3. Make a Resend account, verify a sending domain (Susan's, if she has one), and enter
   Resend's SMTP details in `cgs-live`.
4. Add four GitHub repo variables (test and live address and public key).
5. Allow this cloud session to reach the two `*.supabase.co` addresses (I'll ask with
   an approval card when we get there).

## Still needed before sign-ups open (not blocking the build)

From Susan: privacy policy, terms, community guidelines, minimum age (the code uses 16
as a stand-in setting; 13 is the legal floor under COPPA), avatar art, starter product
list (stand-in made-up products until then), whether first names should ever be shown.
Jose: who signs off, and a check with Susan, since this changes what members see.

## Verification

- `npm test` and `npm run typecheck`: the new engine tests (username rules, quiz to
  profile, heritage default Only me).
- **Server rule check** `tools/rls-check.mjs` against `cgs-test`: makes made-up members
  A and B and a logged-out visitor. For every item and every setting it checks that A
  sees everything of A's, B sees only Community and Everyone items, and the visitor only
  Everyone items, by asking the server directly (not the screen). Also: B can't edit
  A's rows, a pending product is hidden from B, a non-moderator merge is refused, and
  after A deletes the account no row of A's is left. Runs in "App checks" on every pull
  request.
- `tools/shots.cjs` extended: join, verify (test project), setup, change each
  visibility, view as B and as a visitor, kit with "hyd" suggestions, shared kit link,
  delete account. Screenshots at 390 px then 1440 px, plus a "try this" list for Jose on
  `#/preview`.
- Site check gains the new screens. A reviewer subagent that hasn't seen the work checks
  each diff against SPEC.md "Done when" before the pull request.
- Docs updated in the same pull requests: `docs/ARCHITECTURE.md`, SPEC.md (Phase 2 row),
  HANDOFF.md removed once 2b merges.
