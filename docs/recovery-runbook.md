# Haul Command Recovery Runbook

Use this when the site has an incident that requires investigation and recovery beyond a simple rollback.

---

## Severity Classification

| Level | Symptoms | Response |
|---|---|---|
| **P0** | Site is 500/offline, checkout broken, auth broken | Rollback immediately, then investigate |
| **P1** | Critical route broken (directory, loads, calculator) | Rollback if > 30 min to fix, else hotfix |
| **P2** | Visual/UX bug, non-critical route broken | Hotfix on next deploy, no rollback |
| **P3** | Warning/minor issue, no user impact | Normal PR flow |

---

## P0 Response (site down)

```
1. Execute Vercel rollback IMMEDIATELY (< 2 min) — see rollback.md
2. Confirm rollback resolved the issue
3. Open GitHub issue: label=incident, priority=P0
4. Investigate cause (Sentry, GitHub Actions logs, Vercel logs)
5. Create fix on a branch
6. Let CI + preview validation pass
7. Merge to main
8. Write post-mortem in the GitHub issue
```

---

## Diagnosing a broken CI pipeline

### Build fails

```bash
# Replicate locally
npm ci --legacy-peer-deps
npm run build

# Check for:
# 1. TypeScript errors: npm run typecheck
# 2. Missing env vars: compare .env.example with secrets set in GitHub
# 3. Import errors: check the exact error line in the build output
# 4. Dependency conflicts: check package.json for version mismatches
```

### Playwright smoke tests fail

1. Download the `playwright-smoke-report` artifact from the failed CI run
2. Open `playwright-report/index.html` in a browser
3. Find the failing test → click **Trace** or **Screenshot**
4. Identify: missing element? HTTP error? Page crash?

### Preview validation fails

1. Check the PR comment for which routes failed
2. Download `preview-playwright-report-{PR_NUMBER}` artifact
3. Verify the preview URL is actually live (curl it manually)
4. Check if the preview needs specific env vars that are missing from the Vercel preview environment

---

## Environment variable incident recovery

If a missing env var caused a build or runtime failure:

1. Go to **Vercel → Project Settings → Environment Variables**
2. Check that all required variables are set for the environment (Preview vs Production)
3. Go to **GitHub → Settings → Secrets and variables → Actions**
4. Check that GitHub Actions secrets match what’s in `.env.example`
5. Required env vars for CI/build: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SENTRY_DSN` (optional but recommended)

Full env var list: see `docs/release-flow.md`

---

## Sentry is not receiving errors

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel production environment
2. Check that `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are set in GitHub Actions secrets
3. Verify `sentry.client.config.ts` has `enabled: true` (it auto-enables when DSN is present)
4. Check the Sentry dashboard → Projects → confirm events are flowing
5. Test: manually throw an error on the client and check Sentry

---

## Nightly audit fails

If the nightly-audit workflow fails:

1. Go to: https://github.com/haulcommand-max/haul-command/actions/workflows/nightly-audit.yml
2. Download the `nightly-audit-{run_id}` artifact
3. Open `route-health-report.txt` — shows which routes are broken
4. Reproduce: `curl -v https://haulcommand.com/<failing-route>`
5. Check if it’s a transient failure (re-run the nightly manually) or persistent
6. If persistent: open a P1/P2 issue and fix

---

## Database incident recovery

### A migration ran that shouldn’t have

1. **Do not** run another migration blindly
2. Check Supabase → Table Editor → confirm the actual state
3. Write a compensating migration that reverses the damage
4. Test on Supabase staging branch if available
5. Apply via PR flow (migration-safety CI check will run)

### RLS blocking legitimate users

1. Supabase → Authentication → Policies
2. Identify the policy causing the block
3. Test with `supabase inspect` or a direct query
4. Fix via migration PR (never edit policies live in production without a migration file)

---

## Post-mortem template

Use this in the GitHub incident issue:

```markdown
## Incident Post-Mortem

**Date:** 
**Duration:** 
**Severity:** P0 / P1 / P2
**Affected routes:**

### Timeline
- HH:MM — Issue first detected
- HH:MM — Rollback initiated
- HH:MM — Site restored
- HH:MM — Root cause identified
- HH:MM — Fix deployed

### Root Cause

### What worked

### What didn’t work

### Action items
- [ ] Add test to prevent regression
- [ ] Update runbook if process was unclear
```
