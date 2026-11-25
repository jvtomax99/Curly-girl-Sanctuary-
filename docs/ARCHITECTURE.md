# Architecture

Written 2026-11-25 with Phase 1. Update it in the same commit whenever the
structure changes.

A single-page web app: React 19 and TypeScript, built by Vite into static
files in `dist/`, published on GitHub Pages by
`.github/workflows/pages.yml`. No server, no outside services, no
analytics. Quiz answers live only in the phone's localStorage.

## Folders and key files

- `index.html`: the page shell, home-screen settings, manifest and icons.
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
  done.
- `src/data/quiz.ts`: the 10 questions and every quiz word, the stand-in
  heritage list, curl types 2A to 4C.
- `src/data/tips.ts`: tips by group (wavy 2, curly 3, coily 4, and
  all-hair for "Not sure"), each with a source id; the see-a-doctor line.
- `src/data/sources.ts`: the app's copy of `docs/sources.md`.
- `src/engine/state.ts`: the saved quiz (`cgs.quiz.v1`: answers, step,
  heritage switch, traditions note, done, opening seen), `choose` (single
  keeps one, multi toggles, "Prefer not to say" clears the rest and turns
  the heritage switch off), `answered`, and a `parse` that survives broken
  or old saves.
- `src/engine/card.ts`: what the Curly ID Card shows (`cardRows`),
  heritage only with the switch on and never for "Prefer not to say",
  `group` for the tips. Tests: `src/engine/card.test.ts`.
- `src/components/`: `Opening` (stages video, black, pink, words, start on
  timers; Skip; CSS cross-fades under reduce motion), `Quiz` (one question
  per screen, curl grid drawn by `CurlArt`, chips for multi-select, the
  heritage box and switch), `IdCard`, `CardScreen`, `Tips`, `Soon`.
- `src/cardImage.ts`: draws the card as a 1080 x 1350 PNG on a canvas and
  shares it through the phone's share sheet, or downloads it.
- `public/`: copied into `dist/` as is: `sw.js` (offline worker, from
  Marcela's Closet: network first, 4 s on a weak signal, its own cache
  only), `manifest.webmanifest`, `icon.svg` and the PNG icons made from it
  by `tools/make-icons.cjs`.
- `tools/shots.cjs`: the walk-through with screenshots and checks.
- `.github/site-check.cjs`: opens screens of the built app at phone and
  desktop width and fails on missing files or script errors.
  `.github/workflows/check.yml` runs it with the tests on pull requests.

## Other files

- `CLAUDE.md`, `.claude/rules/general.md`, `SPEC.md`, `DESIGN.md`,
  `CREDITS.md`, `docs/sources.md`, Jose's shared docs in `docs/`,
  helpers in `.claude/agents/`, the taste skill in `.claude/skills/taste/`.

## Gotchas

- `node_modules/` and `dist/` are not committed.
- The site check needs a fresh `npm run build` first; it checks `dist/`.
- Fonts on the shared card picture load through `document.fonts.load`
  before drawing; a font that fails falls back without breaking the card.
