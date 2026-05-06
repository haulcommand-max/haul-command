#!/bin/bash
# Run this once to add all new integration keys to Vercel production
# Usage: bash scripts/set-vercel-env.sh

TEAM="team_2Gdjo2UJF7p1MS0pxYz3HAXh"
PROJECT="prj_CZHigC9LvMTK0mCq7HLuRKxc7VQ3"

echo "Setting Haul Command integration env vars in Vercel..."

declare -A VARS=(
  ["FIRECRAWL_API_KEY"]="fc-64edc3454ab24973849e7426ee9457b3"
  ["TAVILY_API_KEY"]="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"
  ["LIVEKIT_API_KEY"]="APIjAqLe6SCiTme"
  ["LIVEKIT_API_SECRET"]="PWP8snAGUrcBzuwtUoMeRfhbVqRk5NLBYXj1S2AbJ6s"
  ["NEXT_PUBLIC_LIVEKIT_URL"]="wss://haulcommand.livekit.cloud"
  ["GEMINI_API_KEY"]="AIzaSyAg5At9F9Def4cBKiYpV3neOWWizaTXEn0"
  ["MOTIVE_CLIENT_ID"]="hNuft5VrhReSIkO4PQ1p3M5K5b77yppR0aMgInkXw"
  ["MOTIVE_CLIENT_SECRET"]="f2uhyW86sDajuswc3oDK6-OKbx_bNGxQV5KTExA8DU"
  ["MOTIVE_WEBHOOK_SECRET"]="29e1fad23b8f435b82ea34eb06977b28"
  ["STRIPE_WEBHOOK_SECRET"]="whsec_nNjvcahfM8wiNv7w8e4YRIdDtUzmojVY"
  ["FLYIO_API_TOKEN"]="fm2_lJPECAAAAAAAEmqVxBACbbDN01J8s07OkURTFLCzwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABdkhB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDwg1M3i7FXXPSsSHv3rgKoiNmlPL0WQHzBLAtGoiMBBSDu3Sw5iQsX/ghLGNSd/MrelIPUsH+3cgVzBkqHETjWmK8236JzoQPmlMQCsMOY+TRpCQQuK1yjZJP10GqJpoQD8N45HaEut05mgTlbDoabNVXVqzO9kmTiXdfCvmMrDLUbxqZ48fzB7qYfBHMQg/+wWaMmBkmICs4Swk2a6fAxLEfMbt69fBK1YzbjGCFQ="
)

for KEY in "${!VARS[@]}"; do
  VALUE="${VARS[$KEY]}"
  echo -n "  Setting $KEY... "
  echo "$VALUE" | vercel env add "$KEY" production --token "$VERCEL_TOKEN" --scope "$TEAM" 2>/dev/null && echo "✓" || echo "already set or error"
done

echo ""
echo "Done. Run 'vercel deploy --prod' or push to main to pick up new env vars."
