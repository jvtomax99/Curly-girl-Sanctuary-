#!/usr/bin/env bash
# Server rule check: starts a throwaway Postgres, loads a stand-in for Supabase's
# sign-in tables, the real migration, then supabase/tests/rules.sql (made-up people).
# Usage: bash tools/db-check.sh     Needs Postgres 16 or newer installed (not running).
set -euo pipefail
cd "$(dirname "$0")/.."
BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
[ -n "$BIN" ] || BIN=$(dirname "$(command -v initdb)")
DIR=$(mktemp -d)
PORT=${PGCHECK_PORT:-54329}
# Postgres refuses to run as root; in a container use the postgres user.
RUN=()
if [ "$(id -u)" = 0 ]; then chown postgres "$DIR"; RUN=(runuser -u postgres --); fi
cleanup() { "${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
"${RUN[@]}" "$BIN/initdb" -D "$DIR/data" -U checker --auth=trust >/dev/null
"${RUN[@]}" "$BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
PSQL=("${RUN[@]}" "$BIN/psql" -h "$DIR" -p "$PORT" -U checker -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f supabase/tests/stub-auth.sql
"${PSQL[@]}" -f supabase/migrations/0001_phase2.sql
"${PSQL[@]}" -f supabase/tests/rules.sql
