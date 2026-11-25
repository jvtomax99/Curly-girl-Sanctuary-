# Handoff (2026-11-25, Phase 2 in progress)

**Goal:** Phase 2 of Curly Girl Sanctuary: accounts, profile with per-item
visibility, Curl Kit, delete account, on Supabase. Plan approved by Jose:
`docs/phase2-plan.md`.

**Decided today (Jose):** Supabase (Free while building, Pro before real
members); Resend free for sign-up email; avatar only in Phase 2 (photo uploads
in Phase 4 with moderation); app-store decision at Phase 6.

**Done (2a, pull request from `claude/optimistic-goodall-vp57s1`):**
database rules (`supabase/migrations/0001_phase2.sql`) with tests on a
throwaway Postgres (`tools/db-check.sh`); join, log in, forgot and new
password, profile with Only me, Community or Everyone on each item, "See my
profile as", public profile by link, settings, delete account, bottom bar,
the sign-up gate (`#/preview`); member walk-through on a stand-in server
(`tools/member-shots.cjs`); Jose's setup guide (`docs/backend-setup.md`).

**Next step:** after Jose's setup, run the member walk-through against the
real `cgs-test` project (the session needs network access to its
`*.supabase.co` address: ask with update_environment). Then 2b: Curl Kit
screens (`#/kit`, `#/u/<name>/kit`, product suggestions with
`search_products`, "Add your own", tools, how I dry) and the moderator page
(`#/admin/products`: approve, merge). The database side of 2b is already in
the migration and tested.

**Not verified yet:** anything against a real Supabase project (none exists
yet); email links (confirm sign-up, reset password) end to end. A local
Supabase couldn't run here: Docker image registries were blocked, and
running downloaded binaries was refused by the session's permissions.

**Left open for Jose or Susan:** privacy policy, terms, community
guidelines, minimum age (16 is a stand-in), avatar art (stand-in uses five
skin tones, middle tone as default), starter product list, whether first
names are ever shown, who signs off, a domain for Resend (and maybe for the
app: it shares jvtomax99.github.io storage with other apps).

**Read first:** CLAUDE.md, `docs/phase2-plan.md`, `docs/ARCHITECTURE.md`
("Phase 2: members"), SPEC.md (Phases).
