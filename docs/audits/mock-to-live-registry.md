# Haul Command Mock-to-Live Registry

_Last updated: 2026-05-01_

This registry exists to prevent production pages from silently depending on mocks, fake keys, old Pinecone paths, or unverified partner connectors.

## Status labels

- `live`: connected to verified production data/API and safe for public surfaces.
- `wired_partial`: connected to some real data, but missing critical relationships, coverage, or QA.
- `fixture_ready`: fixtures exist and can be used for local/dev/seed validation, but production wiring is not complete.
- `mock_only`: hardcoded arrays, fake returns, fake credentials, or demo-only behavior.
- `dormant`: connector/module exists but no usable credential/API route/workflow is active.
- `deprecated`: should be replaced by a newer module.
- `archived_broken`: preserved for reference only; must not be imported by production code.

## Current high-risk inventory

| Surface / module | Current status | Why it matters | Required next action |
|---|---|---|---|
| `app/api/quote/route.ts` | `mock_only` | Hardcoded rate math and mock currency. Does not price steer/tillerman, fifth car, drone survey, police, traffic control, deadhead, layover, corridor demand, or country rules. | Replace with Supabase-backed pricing engine and use `hc_rate_categories` + `hc_hazard_modifiers` fixtures as seed contract. |
| `lib/ai/vector-layer.ts` | `deprecated` | Still imports Pinecone and returns fake vector results. Haul Command is Supabase-first now. | Replace with Supabase vector/search RPC and remove Pinecone dependency from production paths. |
| `components/command/GlobalDensityMap.tsx` | `mock_only` | Uses mock Mapbox fallback and only renders passed markers. Does not query live operator/load/gap density. | Wire to Supabase density view: operators, active loads, unclaimed entities, claim gaps, corridor gaps, AdGrid gaps. |
| `components/mobile/screens/MobileAdGrid.tsx` | `mock_only` | Uses `MOCK_SPONSORS`; commercial surface can misrepresent real sponsors. | Replace with `adgrid_slots`, `sponsors`, `territory_inventory`, and metrics tables. |
| `components/mobile/screens/MobileCorridors.tsx` | `mock_only` | Uses `MOCK_CORRIDORS`; corridor demand/rate/supply numbers are fake. | Replace with corridor stats view and show fixture fallback only in dev. |
| `core/integrations/WCSConnector.ts` | `dormant` | Returns true without real WCS order injection. | Feature flag as `partner_pending` until real endpoint/email agreement exists. |
| `core/integrations/BuildASignConnector.ts` | `dormant` | Mock URL/order IDs; no real fulfillment. | Keep behind marketplace partner flag or replace with approved supplier workflow. |
| `core/integrations/RapidPayConnector.ts` | `dormant` | Fake payout/card IDs when no API key. | Disable public instant-payout claims until a verified rail is active. |
| `supabase/_archived_broken_migrations/*` | `archived_broken` | Contains old/broken glossary RPCs; should never be applied blindly. | Keep archived; migrate any good SQL into fresh verified migrations only. |
| `public/mock/*` | `fixture_ready` | Public mock assets can leak if linked from SEO pages. | Restrict use to dev/demo pages or move to non-public fixtures. |
| `app/dev/*` | `fixture_ready` | Dev routes should not be indexed or public in production. | Gate by environment or remove from production build. |
| `.python/Lib/site-packages/*` | `repo_hygiene_debt` | Local environment appears committed; bloats repo and search. | Remove from git and add `.python/` to `.gitignore` if safe. |

## Production rule

A page, API route, or component cannot be marked production-ready if it:

1. Imports or references `MOCK_` arrays outside dev/test files.
2. Uses fake API keys or fake partner URLs.
3. Returns success from an external connector without a real network call or queued job.
4. Uses Pinecone for new vector/search flows.
5. Shows fake rates, fake sponsor impressions, fake corridor supply, or fake availability without a visible demo label.
6. Reads from old glossary tables while another live glossary table family is being rendered.
7. Depends on archived/broken migrations.

## Acceptance tests for future Claude passes

- Every `mock_only` module must either be wired to Supabase, gated behind dev/demo mode, or explicitly removed from production routes.
- Every commercial surface must have a live-table query path, even if the first fixture dataset is small.
- Every rateable role must be available as a capability, glossary term, load-board filter, pricing input, and profile badge.
- Every fixture must be idempotent and safe to run more than once.
- The mock-to-live audit script must pass before production deploy.
