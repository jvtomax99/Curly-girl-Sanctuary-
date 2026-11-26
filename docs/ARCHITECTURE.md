# Architecture

Written 2026-11-25 with Phase 1. Update it in the same commit whenever the
structure changes.

A single-page web app: React 19 and TypeScript, built by Vite into static
files in `dist/`, published on GitHub Pages by
`.github/workflows/pages.yml`. No analytics. Quiz answers live in the
phone's localStorage. From Phase 2, members' accounts and profiles live in
Supabase (sign-in, Postgres with per-row rules); the app talks to it
straight from the browser. Without the Supabase build settings the app has
no backend and behaves as in Phase 1.

## Folders and key files

- `index.html`: the page shell, home-screen settings, manifest, icons, the description, canonical address and link preview tags (Open Graph, Twitter card).
- `vite.config.ts`: `base: './'` keeps every built path relative (the app
  lives at `/Curly-girl-Sanctuary-/`); Vitest runs `src/**/*.test.ts`.
- `src/main.tsx`: loads the fonts (Fontsource packages, bundled) and
  `styles.css`, starts the app, registers `./sw.js` in the built app only.
- `src/styles.css`: every color and font variable (from `DESIGN.md`) and
  all styles, in sections (Buttons, Opening, Quiz, Curly ID Card, Tips,
  Coming soon).
- `src/App.tsx`: screens by the address's `#` part, so the phone's Back
  works: `#/` opening, `#/quiz/N`, `#/card`, `#/tips`, `#/soon`. A fresh
  launch with a finished quiz opens the card; a started one resumes. No
  skipping ahead past an unanswered question; no card before the quiz is
  done. The question on screen comes from the address (`quizStep`), never
  from `state.step`, which only remembers it for the next launch. Forward
  moves add a history step that remembers where it came from (`go`); the
  app's own Back buttons step back through history when that leads to the
  right screen (`goBack`), so the phone's Back gesture keeps going back.
- `src/data/quiz.ts`: the 9 questions and every quiz word, Susan's
  heritage list (plus retired choices old saves may hold), the hair-loss
  doctor line, curl types 2A to 4C.
- `src/data/tips.ts`: tips by group (wavy 2, curly 3, coily 4, and
  all-hair for "Not sure"), each with a source id; the see-a-doctor line.
- `src/data/sources.ts`: the app's copy of `docs/sources.md`.
- `src/engine/state.ts`: the saved quiz (`cgs.quiz.v1`: answers, step,
  heritage switch, "say more" note (`traditionsNote`), done, opening seen), `choose` (single
  keeps one, multi toggles, "Prefer not to say" clears the rest and turns
  the heritage switch off), `answered`, and a `parse` that survives broken
  or old saves.
- `src/engine/card.ts`: what the Curly ID Card shows (`cardRows`),
  heritage only with the switch on and never for "Prefer not to say",
  `group` for the tips. Tests: `src/engine/card.test.ts`.
- `src/components/`: `Opening` (stages gate, film, black, pink, words, start:
  the gate waits for a tap, the film's end starts the timers; Skip; no film
  (it isn't even downloaded) and CSS cross-fades under reduce motion or data
  saver; a film that can't start or stops moving is stopped and passed over), `Quiz` (one question
  per screen, curl grid drawn by `CurlArt`, chips for multi-select, the
  heritage box and switch), `IdCard`, `CardScreen`, `Tips`, `Soon`,
  `NotFound` (any `#/` address that isn't a screen, and where `public/404.html`
  sends a missing address). Each screen sets the browser tab's name (`titleOf` in
  `App.tsx`). Without a backend, log-in and members-only addresses open `#/soon`.
- `src/cardImage.ts`: draws the card as a 1080 x 1350 PNG on a canvas and
  shares it through the phone's share sheet, or downloads it.
- `public/`: copied into `dist/` as is: `sw.js` (offline worker, from
  Marcela's Closet: network first, 4 s on a weak signal, its own cache
  only; on install it saves the folder page, its built files and the
  WOFF2 fonts the stylesheet names, so one visit is enough to work
  offline; each saved page drops the old builds' files), `manifest.webmanifest`, `icon.svg` and the PNG icons made from it
  by `tools/make-icons.cjs`; `social.jpg`, the link preview picture (`index.html`'s
  `og:image`), drawn from `tools/social-card.html` by `tools/make-social.cjs`;
  `404.html` (GitHub Pages' page for a missing address: it hands over to the
  app's `#/page-not-found`); `sitemap.xml` (the one address).
- `src/components/FilmApp.tsx`: the film's app scene (the real curl picker
  and `IdCard` with made-up answers, labelled Example), shown by `Opening`
  on the film's clock (`APP`: picker 7.15 s, picked 8.2, card 9.15, fading
  10.7, off 10.9). Sized in the film's own units (`--u`: `1cqw`, or
  `min(1vw, 0.5625vh)` where container units are missing, such as iOS 15).
  `tools/shots.cjs` checks it stays inside its sheet at four sizes, one
  of them landscape.
- `public/intro/`: the intro film `intro.mp4` (15 s, cinematic, 1080 by 1920, music only) and
  `gate.webp`, its first frame, shown at the gate. Cut from the rendered
  shots by `tools/make-intro-film.sh <folder>`; the source shots are not in
  the repo (`CREDITS.md`). The film is not saved for offline use (the worker leaves
  Range requests alone): without signal the opening passes over it.
- `tools/shots.cjs`: the walk-through with screenshots and checks, plus
  the cases a review found (offline after one visit, the heritage switch,
  Back after the in-app Back).
- `.github/site-check.cjs`: opens screens of the built app at phone and
  desktop width and fails on missing files or script errors.
  `.github/workflows/check.yml` runs it with the tests on pull requests.

## Phase 2: members (Supabase)

- `supabase/migrations/0001_phase2.sql`: every table and rule. `profiles`
  (curly username, avatar; readable by all once the email is confirmed),
  `members_private` (names and sign-up yeses; owner only; names are removed
  from the sign-in record at sign-up), `app_settings` and
  `signup_allowlist` (the server's sign-up gate; no app access), `profile_items` (one row per item: card,
  scalp, heritage, kit, each with its visibility; heritage forced to
  only_me on insert), `staff`, `products`, `kit_products`, `kit_tools`.
  `can_see(owner, item)` is the one visibility check. Functions:
  `username_available`, `search_products`, `approve_product`,
  `merge_products`, `purge_unconfirmed`, `delete_my_account`. Sign-up runs
  `handle_new_user`, which refuses an account while sign-ups are closed
  (unless allow-listed) or without the age and guidelines yeses;
  `handle_confirmed_user` shows the profile once the email is confirmed. Jose
  pastes this file into each project (`docs/backend-setup.md`).
- `supabase/tests/`: `stub-auth.sql` (a stand-in for Supabase's sign-in
  tables) and `rules.sql` (made-up members A and B, a half-made account and
  a visitor; every visibility, edit, kit, moderator and delete rule).
  `tools/db-check.sh` runs them on a throwaway Postgres; CI runs it too.
- `src/backend.ts`: the Supabase connection (session stored as `cgs.auth`,
  code-in-address sign-in links), and every call the screens make. Also the
  screen side of the sign-up gate: `signupsOpen()` is true with
  `VITE_SIGNUPS_OPEN=true`, or on one phone after visiting `#/preview`
  (shows a "Testing only" banner). The server's gate is what actually stops
  sign-ups.
  `MIN_AGE` (16, a stand-in) and `POLICY_VERSION` live here.
- `src/engine/profile.ts`: username rules, quiz answers to profile items
  (heritage always Only me, the traditions note never sent), turning server
  rows back into card rows, the "See as Community" preview. Tests:
  `src/engine/profile.test.ts`.
- Screens in `src/components/`: `Join`, `LogIn` (with forgot password),
  `NewPassword`, `Profile` (each item with its `Audience` picker; "See my
  profile as" Me, Community, or Everyone, the last asked of the server as a
  logged-out visitor), `PublicProfile` (`#/u/<username>`), `Settings`
  (avatar, username, names, log out, delete account), `Avatar` (stand-in
  drawing, five skin tones), `BottomBar`, `TabSoon`, `Legal` (draft
  placeholders).
- `src/App.tsx` routes: `#/join`, `#/login`, `#/reset`, `#/profile`,
  `#/settings`, `#/u/<username>`, `#/community`, `#/learn`, `#/lab`,
  `#/guidelines`, `#/privacy`, `#/terms`, `#/preview`. Email links come back
  as `?code=` (and `?reset=1`); the app settles them, then cleans the address.
- `tools/fake-supabase.cjs` (with six made-up approved products) and `tools/member-shots.cjs`: a stand-in server
  played inside Playwright, and the member walk-through with screenshots
  (join, profile, visibility, Curl Kit, a shared kit, the moderator page, a second
  member, a visitor, delete, log in).
  CI runs it. The real rules are proven by `tools/db-check.sh`, not by it.
- **Curl Kit (Phase 2b).** `src/data/kit.ts` holds every kit word (product types,
  the tools list, how I dry; ids are stored on the server, labels can change).
  `src/engine/kit.ts` reads kit rows, checks "Add your own" and spots a product
  already listed under almost the same words; tests in `src/engine/kit.test.ts`.
  Screens: `CurlKit` (`#/kit`: search with member counts, "Add your own", tools, how
  I dry, its audience), `ProductSearch` (the shared search box), `KitList` (a kit to
  read), `MemberKit` (`#/u/<username>/kit`, the shared link), `AdminProducts`
  (`#/admin/products`, staff only: approve, turn down, merge). How I dry lives in the
  `kit` profile item's value; the kit item is made at Everyone the first time
  something goes in the kit. `supabase/migrations/0002_phase2b.sql` adds
  `add_own_product` (the product and its kit row together), `turn_down_product`
  (pending products only), and hides `products.added_by` from everyone, moderators
  included (column grants). `tools/db-check.sh` loads every
  migration in number order.
- Build settings (GitHub repo variables, read by `pages.yml`):
  `SUPABASE_URL`, `SUPABASE_PUBLIC_KEY`, `SIGNUPS_OPEN`.

## Other files

- `CLAUDE.md`, `.claude/rules/general.md`, `SPEC.md`, `DESIGN.md`,
  `CREDITS.md`, `docs/sources.md`, Jose's shared docs in `docs/`,
  helpers in `.claude/agents/`, the taste skill in `.claude/skills/taste/`.

## Gotchas

- `node_modules/` and `dist/` are not committed.
- The site check needs a fresh `npm run build` first; it checks `dist/`.
- Playwright can't see requests that pass through the offline worker, so the
  member walk-through blocks the worker (`serviceWorkers: 'block'`).
- The offline worker saves a page under its address without `?…`, so email
  links' one-time codes never pile up in the saved copy.
- Postgres refuses to run as root; `tools/db-check.sh` switches to the
  `postgres` user in a container.
- Fonts on the shared card picture load through `document.fonts.load`
  before drawing; a font that fails falls back without breaking the card.
