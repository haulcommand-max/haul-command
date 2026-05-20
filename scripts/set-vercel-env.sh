#!/bin/bash
set -euo pipefail

# Safely push selected integration environment variables from the current shell
# into Vercel production. This script intentionally does not contain secret
# values. Export the variables locally before running it.
#
# Usage:
#   export VERCEL_TOKEN=...
#   export VERCEL_SCOPE=...
#   export FIRECRAWL_API_KEY=...
#   bash scripts/set-vercel-env.sh

TEAM="${VERCEL_SCOPE:-}"
ENVIRONMENT="${VERCEL_ENVIRONMENT:-production}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN is required."
  exit 1
fi

if [[ -z "$TEAM" ]]; then
  echo "VERCEL_SCOPE is required."
  exit 1
fi

VARS=(
  FIRECRAWL_API_KEY
  TAVILY_API_KEY
  CLAY_WEBHOOK_URL
  CLAY_API_KEY
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

echo "Setting Haul Command integration env vars in Vercel ${ENVIRONMENT}..."

for KEY in "${VARS[@]}"; do
  VALUE="${!KEY:-}"
  if [[ -z "$VALUE" ]]; then
    echo "  Skipping $KEY: not exported locally"
    continue
  fi

  echo -n "  Setting $KEY... "
  echo "$VALUE" | vercel env add "$KEY" "$ENVIRONMENT" --token "$VERCEL_TOKEN" --scope "$TEAM" >/dev/null && echo "ok" || echo "already set or error"
done

echo "Done. Deploy after confirming env vars are present."
