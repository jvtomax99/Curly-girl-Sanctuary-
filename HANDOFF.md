# Handoff (2026-11-25, Phase 2 in progress)

**Goal:** Phase 2 of Curly Girl Sanctuary: accounts, profile with per-item
visibility, Curl Kit, delete account, on Supabase. Plan approved by Jose:
`docs/phase2-plan.md`.

**Done:**
- 2a merged and live (pull request #2): join, log in, password reset, profile with
  Only me, Community or Everyone per item, public profile by link, settings, delete
  account, the server's sign-up gate. The live app still looks like Phase 1 until Jose
  adds the repo variables `SUPABASE_URL` and `SUPABASE_PUBLIC_KEY`.
- 2b built on `claude/phase-2b-curl-kit` (pull request): Curl Kit (`#/kit`),
  shared kit link (`#/u/<username>/kit`), suggestions with member counts, "Add your
  own" (waits for a moderator), tools, how I dry, the moderator page
  (`#/admin/products`: approve, turn down, merge). New server file
  `supabase/migrations/0002_phase2b.sql`, tested in `supabase/tests/rules.sql`.
  Made-up stand-in products until Susan's starter list.

**Next step:** when Jose sends the `cgs-test` address and publishable key (both
public), ask for network access to that `*.supabase.co` host (update_environment or
create_environment), then run the member walk-through against the real project,
email links included where possible, and report what differs from the stand-in.

**Not verified yet:** anything against a real Supabase project; email links end to
end; the PostgREST details the stand-in imitates (embedded products in kit rows,
upsert with ignore-duplicates).

**Left open for Jose or Susan:** privacy policy, terms, community guidelines, minimum
age (16 is a stand-in), avatar art, starter product list, whether first names are ever
shown, who signs off, a domain of the app's own before real members (and one for Resend).

**Read first:** CLAUDE.md, `docs/phase2-plan.md`, `docs/ARCHITECTURE.md`
("Phase 2: members"), `docs/backend-setup.md`, SPEC.md (Phases).
