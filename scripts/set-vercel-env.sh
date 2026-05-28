#!/bin/bash
set -euo pipefail

# Safe helper for setting Haul Command integration env vars in Vercel.
#
# SECURITY RULE:
# Never commit real API keys, secrets, tokens, webhook secrets, or OAuth credentials
# into this repository. This script intentionally reads values from the local
# shell environment only.
#
# Usage:
#   export VERCEL_TOKEN="..."
#   export FIRECRAWL_API_KEY="..."
#   export TAVILY_API_KEY="..."
#   export LIVEKIT_API_KEY="..."
#   export LIVEKIT_API_SECRET="..."
#   export NEXT_PUBLIC_LIVEKIT_URL="..."
#   export GEMINI_API_KEY="..."
#   export MOTIVE_CLIENT_ID="..."
#   export MOTIVE_CLIENT_SECRET="..."
#   export MOTIVE_WEBHOOK_SECRET="..."
#   export STRIPE_WEBHOOK_SECRET="..."
#   export FLYIO_API_TOKEN="..."
#   bash scripts/set-vercel-env.sh
#
# After running this script, rotate any previously committed secrets in their
# provider dashboards before trusting the new environment state.

TEAM="team_2Gdjo2UJF7p1MS0pxYz3HAXh"
PROJECT="prj_CZHigC9LvMTK0mCq7HLuRKxc7VQ3"

REQUIRED_VARS=(
  FIRECRAWL_API_KEY
  TAVILY_API_KEY
  LIVEKIT_API_KEY
  LIVEKIT_API_SECRET
  NEXT_PUBLIC_LIVEKIT_URL
  GEMINI_API_KEY
  MOTIVE_CLIENT_ID
  MOTIVE_CLIENT_SECRET
  MOTIVE_WEBHOOK_SECRET
  STRIPE_WEBHOOK_SECRET
  FLYIO_API_TOKEN
)

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN. Export it locally before running this script." >&2
  exit 1
fi

echo "Checking required env vars before writing to Vercel..."
missing=0
for KEY in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!KEY:-}" ]]; then
    echo "  Missing $KEY"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "Aborting. Set the missing variables locally, then rerun." >&2
  exit 1
fi

echo "Setting Haul Command integration env vars in Vercel project $PROJECT..."
for KEY in "${REQUIRED_VARS[@]}"; do
  VALUE="${!KEY}"
  echo -n "  Setting $KEY... "
  printf "%s" "$VALUE" | vercel env add "$KEY" production --token "$VERCEL_TOKEN" --scope "$TEAM" >/dev/null 2>&1 && echo "ok" || echo "already set or provider returned an error"
done

echo "Done. Run 'vercel deploy --prod' or push to main to pick up changed env vars."
