#!/usr/bin/env bash
# Vercel build: apply migrations over a direct (non-pooled) connection, seed, then build.
# The seed is idempotent: it never overwrites prices, settings or existing content.
set -euo pipefail
DIRECT="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-}}"
if [ -z "$DIRECT" ]; then echo "No database URL. Connect a Postgres store to this project." >&2; exit 1; fi
npx prisma generate
DATABASE_URL="$DIRECT" npx prisma migrate deploy
DATABASE_URL="$DIRECT" npx tsx prisma/seed.ts
npx next build
