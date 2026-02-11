#!/usr/bin/env sh
# Generate screenshots for all projects that are not locked (screenshot_locked = false),
# then set screenshot_locked = true for each one that succeeded.
# Requires: Node, npx, DATABASE_URL in .env

set -e

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set. Add it to .env or the environment."
  exit 1
fi

echo "Generating screenshots for unlocked projects…"
npx tsx scripts/generate-screenshots-unlocked.ts
