# Agent Guardrails — Read Before Touching Production Surfaces

This is an orientation map for Claude Code (and any other coding agent) working
in this repository. It does not replace `CLAUDE.md` — it points to the highest-
risk areas where agents have historically caused regressions, and gives the
exact source of truth for each.

If a note here ever conflicts with `CLAUDE.md`, **`CLAUDE.md` wins.** This file
is supplementary.

---

## 1. 120-Country Scope (Never Drift Back to 57)

Haul Command serves **120 countries**, tiered A–E. Any "57 countries" / "57-country"
reference in shipped UI, server libs, or components is stale legacy drift.

- Rule: see `CLAUDE.md` > "120-Country Standard (Never Drift Back)"
- Single source of truth for live counts: `lib/server/global-stats.ts` (`getGlobalStats`)
- CI guard: `.github/workflows/country-drift.yml`
- Local scan: `npm run lint:country-drift`
- Scanner source + allowlist: `scripts/check-country-drift.js`

The scanner deliberately scopes to `app/`, `components/`, `lib/`, `pages/` and
ignores historical SQL migrations and planning docs. If a hit is intentional
historical content, allowlist the path in the script with a one-line reason
rather than weakening the regex.

---

## 2. No Fake Live Stats

Never display fabricated, rounded-up, or zeroed-out platform numbers as if they
were live. The trust cost with industry professionals is permanent.

- Source of truth: `lib/server/global-stats.ts`
- The fallback object in that file is intentionally honest. Do not inflate it.
- If a Supabase query returns zero, hide the surface or label it honestly
  ("Seeded Corridors", "Listed Operators") — do not show "0 active" alongside
  marketing copy that claims "7,712+ verified."

When in doubt, prefer hiding a number to inventing one.

---

## 3. Outreach Policy (Hard Stop — Voice Only, 90-Day Seasoning)

No email, SMS, or voice outreach to operators is permitted unless **all**
conditions hold:

- Profile age ≥ 90 days since first seen
- Authority score ≥ 40
- Channel is **LiveKit voice** (no email, no SMS, ever)

These are enforced at the database layer via the trigger
`trg_claim_outreach_seasoning` and the `hc_policy` keys:

- `claim.seasoning_days_minimum = 90`
- `claim.outreach.requires_authority_score = 40`
- `claim.outreach.no_email_no_sms = true`

Before scheduling any outreach in code, query `hc_policy` and respect what it
returns at runtime — do not hard-code thresholds in TypeScript. The Supabase
trigger is the last line of defense; treat it as a guard, not a substitute for
checking policy in the application.

If you find application code that bypasses `hc_policy` or sends to a non-voice
channel, treat it as a P0 regression and stop.

---

## 4. Migration Source Sprawl (Know Where the Truth Lives)

This repo currently has SQL migrations in **four** locations. Before writing a
new migration or assuming a table doesn't exist, know which tree you're in:

| Path | Role |
|------|------|
| `supabase/migrations/` | Primary tree. Source of truth for the production Supabase project (`hvjyfyzotqobfkakjozp`). New schema work goes here. |
| `supabase/_archived_broken_migrations/` | Quarantine for migrations that failed replay. **Do not edit; do not re-introduce.** |
| `db/migrations/` | Older payments / global-rails migrations. Treat as historical unless explicitly extending those modules. |
| `lib/db/migrations/` | One-off route-intelligence unified bundle. Historical. |
| `haul-command-hub/supabase/migrations/` | A nested sub-app (`haul-command-hub/`) with its own migration history. Not the main app — only edit if the task is explicitly inside that sub-app. |

Rules of thumb:

1. **Do not duplicate tables across trees.** Check `CLAUDE.md` > "Supabase Table
   Inventory" first; the canonical names there are the only ones agents should
   target.
2. New migrations belong in `supabase/migrations/` with the timestamp prefix
   convention used by the most recent files in that directory.
3. Never apply DDL via raw `execute_sql`. Use `apply_migration` (per
   `CLAUDE.md` > "Stack-Specific Verification").
4. If you suspect two trees disagree, surface the conflict to the user before
   editing — do not pick a winner silently.

---

## 5. Vercel Scope / Auth Troubleshooting

Symptoms commonly mistaken for "broken code" that are actually scope/auth issues:

- **`vercel` CLI shows the wrong project or "no project linked"** — the local
  `.vercel/` directory is missing or points elsewhere. Re-link with
  `vercel link --scope team_2Gdjo2UJF7p1MS0pxYz3HAXh --project prj_CZHigC9LvMTK0mCq7HLuRKxc7VQ3`.
  Project and team IDs are pinned in `CLAUDE.md` § 10.
- **"Not authorized" / 403 from Vercel CLI** — token belongs to the wrong scope.
  Verify with `vercel whoami` and `vercel teams ls`. Switch with
  `vercel switch <team>`. Never paste a personal token into team CI.
- **Build green locally, red on Vercel** — TypeScript errors don't fail the
  Vercel build (`ignoreBuildErrors: true` in `next.config.ts`) but the GitHub
  Action `.github/workflows/typecheck.yml` does. Run `npx tsc --noEmit`
  locally; do not bypass the gate.
- **Static-generation timeouts on `/directory`, `/(app)`, `/admin`** — a route
  is missing `export const dynamic = 'force-dynamic'`. The Build Guard
  workflow (`.github/workflows/build-guard.yml`) enumerates the protected
  prefixes. Add `force-dynamic` and `revalidate = 0`; do not add
  `generateStaticParams` to those trees.
- **Domain/DNS issues for `haulcommand.com`** — see `docs/vercel-domain-setup.md`.

Agents must **not** trigger production deploys, change Vercel project settings,
or rotate tokens without explicit user confirmation.

---

## 6. Repo Hygiene

The repo currently carries large stale artifacts at the root
(`HomeClient_YP.tsx.tmp`, multiple `tmp-build*.log` / `temp_build.txt` files,
PowerShell `fix-*.ps1` one-shots, the `update_57.js` rewriter). These are out
of scope for routine tasks — do not delete them as part of an unrelated change,
but do not extend them either. If a task is explicitly "clean up stale repo
artifacts," propose the deletion list to the user first; some of these files
are referenced by ad-hoc scripts that don't show up in import graphs.

---

## 7. Verification Checklist Before Reporting "Done"

For any non-trivial change, run what's available locally:

- `npm run lint:country-drift` — scope drift
- `npm run lint:mojibake` — encoding regressions
- `npm run typecheck` — TypeScript gate
- `npm run lint` — ESLint
- `npm run build` — Next build (only when the change can plausibly affect build)

If a check cannot be run in the current environment, say so explicitly in the
final report and tell the user which command to run themselves. Do not claim a
verification that did not happen.
