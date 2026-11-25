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

New repo. No app code yet. The plan comes from Susan's "App Build Brief
v2" (November 2026), summarized in `SPEC.md`. The PDF itself stays out of
the repo (her document; the repo is public). **Next:** Jose picks the stack
and hosting (`SPEC.md`, "Decisions waiting"), then Phase 1.

## Rules for this repo

- **No app code before the stack is chosen.** When Jose picks it, write it
  into `SPEC.md` and fill in "Commands" and "Preview, checks and going
  live" below in the same commit.
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
- **Accessible by default.** Text only in the contrast pairs `DESIGN.md`
  marks "all text"; every animation has a reduce-motion version; tap
  targets at least 44 px; inputs at least 16 px (iPhone zooms otherwise).
- **Use the brief's names**: Curly ID Card, curly username, Curl Kit, Curl
  Lab, Hair Posts (Best Day, Hot Mess), Tutorials, Ask the Sanctuary,
  Around the World, Holy Grail, "Join the Sanctuary", "No thanks, just the
  quiz". Two names are still open (`SPEC.md`): use the working names.
- **Intro video** is a placeholder slot until Susan's script and footage
  exist. Never make or buy one without asking.
- **Public repo.** Paid raw files (fonts, art, video) can't be committed
  (`docs/assets.md`, section 9). The suggested fonts are Google Fonts
  (Open Font License) and can be bundled. Asset budget: TO FILL (ask Jose
  before the first asset).

## Commands

TO FILL once the stack is chosen.

## Preview, checks and going live

- **Hosting:** TO FILL with the stack. Until then, nothing is live.
- **Preview.** Playwright screenshots at 390 px first, then 1440 px, plus a
  short "try this" list. UI changes: before and after.
- **Checks.** TO FILL with the stack (tests, type check, build, a site
  check). Whatever they are, they run on every pull request and must be
  green before asking Jose to push.
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
