# CLAUDE.md: Curly Girl Sanctuary

**Curly Girl Sanctuary**, "Hey beautiful, Love the Curls." A phone-first
app for curly girls (and boys): a 10-question quiz gives a shareable
Curly ID Card, then the app opens into Community, Learn and the Curl Lab.
Jose builds it for Susan, the owner. The real users are curly people of
every pattern and heritage, not Jose and not Susan.

Read first: `HANDOFF.md` if there is one, `SPEC.md` (what, who, "Done
when", phases; TO FILL lines wait for Jose), `docs/ARCHITECTURE.md` (map of
files), `DESIGN.md` (look). The rules shared by all of Jose's projects are
in `.claude/rules/general.md`; where this file differs, this file wins.

## Status (2026-11-25)

The plan comes from Susan's "App Build Brief v2" (November 2026),
summarized in `SPEC.md`. The PDF itself stays out of the repo (her
document; the repo is public). Jose, 2026-11-25: "just webapp for now".
Phase 1 (opening, quiz, Curly ID Card, tips) went live 2026-11-25, with
no server. Backend picked 2026-11-25: Supabase, with Resend for sign-up
email. **Now:** Phase 2 (`docs/phase2-plan.md`); see `HANDOFF.md`.

## Rules for this repo

- **Web app on Supabase** (Jose, 2026-11-25). Accounts and profiles live
  in Supabase; every rule about who sees what is in
  `supabase/migrations/`, each rule change with a check in
  `supabase/tests/rules.sql` (`bash tools/db-check.sh`). No uploads until
  Phase 4 (with moderation), no other outside services without asking.
  Sign-ups stay closed on the server (`app_settings`) until Susan's
  policy, terms, guidelines and the minimum age exist. Quiz answers stay
  on the phone (`cgs.quiz.v1`) until the person joins; a change to its
  shape must still read old saves.
- **This one has a build step** (Jose picked it, 2026-11-25): React,
  TypeScript and Vite, like Marcela's Closet. Edit `src/`, never `dist/`.
  The card's rules stay plain TypeScript in `src/engine/`, each rule
  change with a test in `src/engine/card.test.ts`. Every quiz word lives
  in `src/data/quiz.ts`.
- **Relative paths only.** The app lives at `/Curly-girl-Sanctuary-/`, so
  a link starting with `/` breaks (`base: './'` in `vite.config.ts`).
- **Sources twice.** `docs/sources.md` and `src/data/sources.ts` hold the
  same list: change both together.
- **Who signs off:** TO FILL (Jose alone, or Susan too for words and looks
  that speak for her). Until filled, show Jose, and remind him to check
  plans that change what members see with Susan.
- **Safe space first.** Any feature that lets a person post, comment,
  review or upload ships with report, block, mute and remove, and the
  owner's moderation queue, in the same phase. Never after. Guidelines are
  accepted at sign-up.
- **Privacy by choice.** Every profile item has its own visibility (Only
  me, Community, Everyone). Heritage starts as Only me. Deeper scalp and
  health answers from the Curl Lab are always private. Visibility is
  enforced by the server's data rules, never only by hiding it on screen.
  Heritage and health answers never feed ads, analytics or another
  person's feed, and heritage is never guessed from a photo, a name or a
  curl type. Curl results come from the hair answers alone.
- **Real people's data never goes in the repo.** No member emails, photos,
  posts, quiz answers or screenshots of them. Test accounts and fixtures
  are made-up people with stand-in pictures.
- **Honest information.** Every hair-care or health claim in Learn, the
  tips or the quiz's explanations (the porosity test included) cites a
  source in `docs/sources.md`. No source, no claim; never from memory.
  Vitamin pages: education only, a Watch out box, an evidence label
  (strong, some, limited), sources on every page, no dosing, no affiliate
  links, no vitamin suggestions from quiz results. They show "not yet
  reviewed" until the qualified reviewer signs off, and stay off the live
  app until then. Itching, flaking or hair loss point to a doctor, never
  to a product.
- **Cultures are sourced and credited.** Around the World and the mixed
  curls pages describe traditions from sources or named contributors,
  never invented, never as stereotypes. Product names only; no buy links.
- **No Shop, no buy links, no affiliate links in v1.** When the Shop comes
  (`SPEC.md`, Later): every paid link labelled, Holy Grail picks and
  reviews never changed for commission.
- **Supplements are not reviewable** in Ask the Sanctuary, and the
  community rule holds: nobody tells another member what dose to take or
  to stop a medication.
- **Secrets** (database keys, email service keys) live only in the
  hosting's settings, never in the repo, a chat or a log. Anything Jose has
  to save gets one copy-paste block with `YOUR_VALUE_HERE` for the secret.
- **Offline worker** (`public/sw.js`, from Marcela's Closet): network
  first, its own cache only (`cgs-app:/Curly-girl-Sanctuary-/`); other apps
  share jvtomax99.github.io, so never open or delete their caches.
- **Accessible by default.** Text only in the contrast pairs `DESIGN.md`
  marks "all text"; every animation has a reduce-motion version; tap
  targets at least 44 px; inputs at least 16 px (iPhone zooms otherwise).
- **Use the brief's names**: Curly ID Card, curly username, Curl Kit, Curl
  Lab, Hair Posts (Best Day, Hot Mess), Tutorials, Ask the Sanctuary,
  Around the World, Holy Grail, "Join the Sanctuary", "No thanks, just the
  quiz". Two names are still open (`SPEC.md`): use the working names.
- **Intro film** (`public/intro/intro.mp4`, 15 s, painted, full HD, music
  only, and its first picture `gate.webp`; cut by
  `tools/make-intro-film.sh`), made 2026-11-26 with Jose's Runway credits
  (Jose picked this painted film over the later near-real one, 2026-11-27).
  Its lead is Susan's painted avatar (Jose's pick; Susan's photos stay out
  of the repo). No photoreal picture or video of Susan or any real person.
  No words are painted or spoken in the film: the only words are the app's
  own screens, drawn by `src/components/FilmApp.tsx` over the film on the
  times in `APP` (`Opening.tsx`), which must match the cut. Runway credits
  are Jose's: say what a batch will cost before making it.
- **Public repo.** Paid raw files (fonts, art, video) can't be committed
  (`docs/assets.md`, section 9). The suggested fonts are Google Fonts
  (Open Font License) and can be bundled. Asset budget: TO FILL (ask Jose
  before the first asset).

## Commands

- `npm install`, then `npm test`, `npm run typecheck`, `npm run build`
  (into `dist/`), `npm run dev` while working.
- Site check, after a build: `node .github/site-check.cjs index.html
  "index.html#/quiz/0" "index.html#/card"`.
- Walk-through with screenshots: serve `dist/` from a parent folder as
  `/Curly-girl-Sanctuary-/` (a folder holding a link named
  `Curly-girl-Sanctuary-` to `dist`, then `python3 -m http.server 8130`),
  then `node tools/shots.cjs <url> <out-folder> [scale]`. It answers the
  quiz with made-up answers, reloads mid-quiz, saves the card picture,
  goes offline, and checks reduce motion; it prints any problem.
- Icons: `node tools/make-icons.cjs` after changing `public/icon.svg`.

## Preview, checks and going live

- **Hosting: GitHub Pages**, at
  https://jvtomax99.github.io/Curly-girl-Sanctuary-/ (the path is
  case-sensitive). `.github/workflows/pages.yml` tests, builds and
  publishes `dist/` on every push to `main`, so merging is going live. The
  repo's Settings, Pages, Source must be "GitHub Actions" (a repo setting:
  Jose does it).
- **Preview.** Playwright screenshots at 390 px first, then 1440 px, plus a
  short "try this" list. UI changes: before and after.
- **Checks.** `.github/workflows/check.yml` ("App checks") runs the
  tests, type check, build and site check on every pull request; all must
  be green before asking Jose to push.
- **Into `main`.** A pull request, a phone notification naming the change
  and saying it needs his "push", and buttons ("Push" first). On "Push",
  merge it, check the live app, then one line on how to undo it.

## Tools

- **Helpers** in `.claude/agents/`: `scout` (Haiku, finding things),
  `test-runner` (Haiku, running checks, failures only), `builder` (Sonnet,
  exactly specified text edits, never health content, privacy rules or
  logic). Check what they report before relying on it.
- **Taste skill** (`.claude/skills/taste/`): it asks for the Playwright MCP
  server. In a cloud session use the installed Playwright instead and run
  its `references/extract.js` with `page.evaluate`.
- **Refactor.** `docs/refactor.md`, run when Jose asks for "Refactor:
  CLEANUP.md items ...". `docs/cleanup-audit.md` writes `docs/CLEANUP.md`
  (none yet).
