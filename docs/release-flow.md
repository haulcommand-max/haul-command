# Haul Command Release Flow

This document explains the complete release lifecycle for Haul Command — from Antigravity-generated code to live production.

---

## Architecture Overview

```
Antigravity (writes code)
        ↓
  commit + push to feature branch
        ↓
  GitHub PR → CI checks run (lint, typecheck, build, smoke tests)
        ↓
  Vercel preview deployed automatically
        ↓
  preview-validate.yml runs Playwright against preview URL
        ↓
  PR approved + merged to main
        ↓
  main-release.yml: full CI + Vercel production deploy
        ↓
  release-tag.yml: GitHub release created with notes + rollback target
        ↓
  Sentry: release tracked, source maps uploaded
        ↓
  Nightly: route audit confirms nothing silently broke
```

---

## Branches

| Branch pattern | Purpose |
|---|---|
| `main` | Production. **Protected. No direct pushes.** |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `release/*` | Formal release branches (optional) |
| `hotfix/*` | Emergency patches |

---

## Step-by-Step: Normal Release

### 1. Build in Antigravity
Antigravity writes code and commits to a feature branch (e.g. `feature/escort-calculator-upgrade`).

### 2. Push to GitHub
```bash
git push origin feature/escort-calculator-upgrade
```

### 3. Open Pull Request (main ← feature branch)
GitHub will automatically:
- Run `ci.yml`: lint → typecheck → unit tests → build → Playwright smoke (localhost)
- Run `pr-preview.yml`: deploy Vercel preview
- Run `preview-validate.yml`: Playwright against live preview URL
- Post preview URL + route check results as PR comments

**A PR cannot merge to main until all required checks pass.**

### 4. Review + Merge
Once all checks pass, merge the PR to `main`.

### 5. Production Deploy (automatic)
`main-release.yml` runs automatically:
- Full CI (lint, typecheck, build)
- Vercel production deployment
- Lighthouse quality gate
- Slack notification

### 6. Release Tag (automatic)
`release-tag.yml` runs automatically after merge:
- Creates GitHub release with date-versioned tag (e.g. `v2026.04.03.1`)
- Generates release notes from commit history
- Lists affected app routes
- Records rollback target

---

## Required GitHub Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Source | Required |
|---|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens | ✅ Required |
| `VERCEL_ORG_ID` | Vercel project settings | ✅ Required |
| `VERCEL_PROJECT_ID` | Vercel project settings | ✅ Required |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard | ✅ Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard | ✅ Required |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project → Settings → SDK Setup | ⚠️ Recommended |
| `SENTRY_AUTH_TOKEN` | Sentry → User Settings → Auth Tokens | ⚠️ For source maps |
| `SENTRY_ORG` | Sentry organization slug | ⚠️ For source maps |
| `SENTRY_PROJECT` | Sentry project slug | ⚠️ For source maps |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox dashboard | ⚠️ If map pages used |
| `SLACK_WEBHOOK_URL` | Slack → API → Incoming Webhooks | ℹ️ Optional |

---

## Required GitHub Branch Protection (manual setup)

See [Branch Protection Setup](#branch-protection-setup) below.

---

## Branch Protection Setup

Go to: **GitHub → haul-command repo → Settings → Branches → Add rule for `main`**

Enable these settings:

```
☑ Require a pull request before merging
  ☑ Require approvals: 1 (adjust when team grows)
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  Required checks:
    - CI / Lint
    - CI / Typecheck
    - CI / Build
    - CI / Unit Tests
    - CI / Smoke Tests (localhost)
    - Preview / Critical Route Validation
    - PR / Migration Safety

☑ Require branches to be up to date before merging

☑ Block force pushes
☑ Restrict deletions
```

> **Note:** Status check names must exactly match the `name:` field in each workflow job.

---

## Workflow Files Reference

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | PR to main + push to non-main | Full CI: lint, typecheck, build, smoke |
| `.github/workflows/pr-preview.yml` | PR to main | Deploy Vercel preview |
| `.github/workflows/preview-validate.yml` | PR to main | Playwright against preview URL |
| `.github/workflows/main-release.yml` | Push to main | CI + Vercel production deploy + Lighthouse |
| `.github/workflows/release-tag.yml` | Push to main | Auto-tag + release notes |
| `.github/workflows/nightly-audit.yml` | 06:00 UTC daily | Route health + SEO file checks |
| `.github/workflows/pr-ci.yml` | PR to main | Legacy CI (kept for status check compatibility) |
