#!/usr/bin/env bash
# Applies the migrations to a throwaway database on a local Postgres (15+) and runs the rule tests.
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="rennova_test_$$"
createdb "$db"
trap 'dropdb --if-exists "$db"' EXIT

# The shim creates a publication, which warns on servers without logical replication; that's fine here.
psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$here/00_supabase_shim.sql" 2>&1 | grep -v "wal_level" || true
for migration in "$here"/../migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$db" -f "$migration"
done

# One session for all rule files, so later files can reuse the people and helpers set up earlier.
files=()
for t in "$here"/[1-9]*.sql; do files+=(-f "$t"); done
psql -v ON_ERROR_STOP=1 -qtA -d "$db" "${files[@]}" 2>&1 \
  | sed -n -e 's/^psql:[^ ]* NOTICE:  /  /p' -e '/ERROR\|FAILED\|passed/p'
