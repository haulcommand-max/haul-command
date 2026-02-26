# HAUL COMMAND OS — DEPLOYED STATE
**Last verified**: 2026-02-22 | **Project ref**: `hvjyfyzotqobfkakjozp`

> This document tracks only what is **actually deployed** to the Supabase project.
> For the design specification, see `SPEC.md`.
> For deployment commands, see `DEPLOY.md`.

---

## Supabase Project

| Item | Value |
|---|---|
| Project ref | `hvjyfyzotqobfkakjozp` |
| URL | `https://hvjyfyzotqobfkakjozp.supabase.co` |
| DB password | (in Supabase dashboard) |
| Service role key | (in Supabase dashboard → Project Settings → API) |

---

## Migrations — Deployed

These are the migration files in `supabase/migrations/`. Run `npx supabase db push` to apply any pending.

| # | File | Contents |
|---|---|---|
| 0001 | `0001_init.sql` | Core tables: providers, loads, jobs, drivers |
| 0002 | `0002_rls.sql` | Row Level Security policies |
| 0003 | `0003_public_views.sql` | Public safe views for SEO |
| 0004 | `0004_rpc_create_job_from_offer.sql` | RPC: atomic job creation from offer |
| 0005 | `0005_leaderboards.sql` | Leaderboard tables |
| 0006 | `0006_leaderboards_views.sql` | Leaderboard views |
| 0007 | `0007_rank_tiers.sql` | Driver rank tiers |
| 0008 | `0008_directory_loads_view.sql` | Directory + loads combined view |
| 0009 | `0009_trust_report_cards.sql` | Trust report card tables |
| 0010a | `0010_leaderboard_extensions.sql` | Leaderboard extensions |
| 0010b | `0010_leaderboards_reconcile.sql` | Leaderboard reconcile |
| 0011 | `0011_leaderboards_rls.sql` | Leaderboard RLS |
| 0012 | `0012_leaderboards_realtime_trigger.sql` | Realtime triggers |
| 0013 | `0013_driver_rank_tiers_v2.sql` | Rank tiers v2 |
| 0014 | `0014_fortune_5_enhancements.sql` | Fortune 5 feature set |
| 0015 | `0015_the_brain.sql` | Intelligence layer tables |
| 0016a | `0016_core_directory_authz.sql` | Directory authorization |
| 0016b | `0016_leaderboard_trust_reminders.sql` | Leaderboard trust reminders |
| 0017 | `0017_rpc_atomic_jobs_create.sql` | Atomic job creation v2 |
| 0019 | `0019_admin_settings_feature_flags.sql` | Admin settings + feature flags |
| 0020 | `0020_public_views_safe_for_seo.sql` | SEO-safe public views |
| 0021 | `0021_leaderboard_reconcile_nightly.sql` | Nightly leaderboard reconcile |
| 0022 | `0022_pricing_engine.sql` | Pricing engine tables |
| 0023 | `0023_pricing_seed.sql` | Pricing seed data |
| 0024 | `0024_growth_installs_referrals.sql` | Growth: installs + referrals |
| 0025 | `0025_growth_public_views.sql` | Growth public views |
| — | `20240218000000_feature_flags.sql` | Feature flags table |
| — | `20240218000001_sources_ingest.sql` | Sources ingestion table |
| — | `20240218000002_analytics_events.sql` | Analytics events |
| — | `20240218000003_evidence_engine.sql` | Evidence engine tables |
| — | `20240218000004_equipment_tiers.sql` | Equipment tiers |
| — | `20260222_notification_events.sql` | ✅ Notification inbox table + RLS |
| — | `20260222_idempotency_keys.sql` | ✅ Idempotency keys dedup table + purge fn |

---

## Edge Functions — Deployed

Run `npx supabase functions deploy --no-verify-jwt` to deploy/redeploy all.

| Function | Status | Notes |
|---|---|---|
| `admin-set-setting` | ✅ deployed | |
| `broker-score-recompute` | ✅ deployed | |
| `compliance-match-preview` | ✅ deployed | |
| `compliance-reminders-run` | ✅ deployed | |
| `compliance-snapshot-generate` | ✅ deployed | |
| `deadhead-estimate` | ✅ deployed | |
| `deeplink-redirect` | ✅ deployed | |
| `directory-claim-submit` | ✅ deployed | |
| `docs-init-upload` | ✅ deployed | |
| `driver-presence-update` | ✅ deployed | |
| `hazard-score-rollup` | ✅ deployed | |
| `installs-track` | ✅ deployed | |
| `jobs-create-from-offer` | ✅ deployed | |
| `leaderboard-snapshot-hourly` | ✅ deployed | |
| `match-generate` | ✅ deployed | |
| `payments-capture` | ✅ deployed | |
| `payments-preauth` | ✅ deployed | |
| `rate-index-recompute` | ✅ deployed | |
| `referrals-redeem` | ✅ deployed | |
| `reviews-log` | ✅ deployed | |
| `stripe-webhook` | ✅ deployed | |

---

## Secrets — Required in Production

Set via `npx supabase secrets set KEY=value`:

| Secret | Purpose | Status |
|---|---|---|
| `SUPABASE_URL` | Self-reference for edge fn calls | ⚠️ Must set |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for edge fns | ⚠️ Must set |
| `STRIPE_SECRET_KEY` | Stripe payments | ⚠️ Must set |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | ⚠️ Must set |
| `FCM_SERVER_KEY` | Firebase push notifications | ⚠️ Must set |
| `MAPS_API_KEY` | Polyline compute (on-demand) | ⚠️ Must set |

---

## Frontend Surfaces — Deploy Status

| Surface | Repo path | Status |
|---|---|---|
| Directory / Money Site | `haul-command-hub/` | 🟡 In progress |
| Ops Dashboard | `command-dashboard/` | 🟡 In progress |
| Mobile App | (not scaffolded yet) | ⬜ Queued |
| Vercel | (not connected yet) | ⬜ Queued |

---

## Known Pending Actions

- [x] ~~Add `notification_events` table migration~~ — deployed 2026-02-22
- [x] ~~Add `idempotency_keys` table migration~~ — deployed 2026-02-22
- [x] ~~Dev server crash (`[id]` vs `[loadId]` conflict)~~ — fixed: `.next` cache cleared, `proxy.ts` created
- [ ] Connect `haul-command-hub` to Vercel
- [ ] Set all production secrets in Supabase dashboard
- [ ] Run `npx supabase link --project-ref hvjyfyzotqobfkakjozp`
