# Architecture

No app code yet (2026-11-25). Fill this in when the stack is chosen
(`SPEC.md`, "Decisions waiting") and keep it short and current: update it
in the same commit whenever the structure changes.

## Files today

- `CLAUDE.md`: rules for Claude in this repo. `.claude/rules/general.md`:
  the rules shared by all of Jose's projects.
- `SPEC.md`: what, who, "Done when", Not in v1, Later, phases.
- `DESIGN.md`: colors, contrast pairs, fonts, shapes, motion.
- `CREDITS.md`: every asset, its source and license.
- `docs/sources.md`: sources for every hair-care and health claim.
- `docs/assets.md`, `docs/design-rules.md`, `docs/cleanup-audit.md`,
  `docs/refactor.md`: Jose's shared working rules (same in every repo).
- `.claude/agents/`: helpers (`scout`, `test-runner`, `builder`).
- `.claude/skills/taste/`: the taste skill (MIT, `SOURCE.md`).

## To write once the stack exists

- Folders and key files.
- Data model: every table or collection, who can read and write it, and
  which fields follow the person's visibility settings (favorite curl pic,
  Curly ID Card, heritage, Curl Kit, scalp type) and which are always
  private (deeper scalp and health answers).
- How sign-in, uploads, reports and moderation move through the app.
- Where secrets live (hosting settings only) and how a deploy happens.
- Gotchas learned the hard way.
