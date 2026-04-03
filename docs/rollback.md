# Haul Command Rollback Runbook

This document explains how to roll back a broken production deployment immediately.

---

## ⚠️ If the site is broken right now

**Fastest option: Vercel dashboard rollback (< 2 minutes)**

1. Go to: https://vercel.com/haulcommand-max/haul-command/deployments
2. Find the last **successful** deployment (green indicator)
3. Click the three-dot menu → **Promote to Production**
4. Confirm. Site rolls back instantly.

---

## Option 2: Vercel CLI rollback

```bash
# Install if not present
npm i -g vercel

# Login
vercel login

# List recent deployments
vercel ls haul-command

# Rollback to specific deployment (copy the URL from the list)
vercel rollback https://haul-command-abc123.vercel.app --token=$VERCEL_TOKEN
```

---

## Option 3: Git revert (when code must be fixed, not just rolled back)

```bash
# Find the breaking commit
git log --oneline -20

# Revert the breaking commit (creates a new commit)
git revert <commit-sha>

# Push to a new branch and open PR
git push origin fix/revert-broken-change
# Open PR → let CI pass → merge to main
```

> Do NOT force-push to main. Always use revert + PR flow.

---

## How to identify which commit broke the site

### Check GitHub Releases
1. Go to: https://github.com/haulcommand-max/haul-command/releases
2. Each release lists the commits included and the affected app routes
3. Find the release where the site broke
4. Check the commits in that release

### Check Sentry
1. Go to Sentry → Haul Command project → Issues
2. Filter by: **First seen** = around the deployment time
3. Check the **Release** tag on the issue (shows which deploy introduced it)
4. Use the stack trace to identify the file and line

### Check GitHub Actions
1. Go to: https://github.com/haulcommand-max/haul-command/actions
2. Find the failed workflow run
3. Expand steps to see which check failed
4. Download Playwright artifacts (screenshots) for visual evidence

### Check Vercel Deployment Logs
1. Go to: https://vercel.com/haulcommand-max/haul-command/deployments
2. Click on the failing deployment
3. Go to **Logs** tab
4. Look for runtime errors, missing env vars, or build failures

---

## Rollback Checklist

```
[ ] Is the site actually broken? (check haulcommand.com manually)
[ ] Is it a UI bug or a crash? (UI bugs may not need rollback)
[ ] Check Sentry for error volume and stack trace
[ ] Identify the deployment that introduced the issue
[ ] Execute Vercel rollback (option 1) for immediate relief
[ ] Open a GitHub issue with: symptoms, affected routes, Sentry link, Vercel deployment URL
[ ] Create fix branch from main
[ ] Fix the issue + open PR
[ ] Let CI pass
[ ] Merge to main (this replaces the rolled-back deployment)
[ ] Verify fix on production
[ ] Close the GitHub issue
```

---

## Emergency contacts / links

| Resource | URL |
|---|---|
| Vercel deployments | https://vercel.com/haulcommand-max/haul-command/deployments |
| GitHub Actions | https://github.com/haulcommand-max/haul-command/actions |
| GitHub Releases | https://github.com/haulcommand-max/haul-command/releases |
| Sentry dashboard | https://sentry.io/ (your org/project) |
| Production URL | https://haulcommand.com |

---

## What rollback does NOT fix

- **Database migrations**: Supabase migrations are NOT rolled back by Vercel rollback. If a migration caused the issue, you need to manually write a compensating migration or restore from a Supabase backup.
- **Third-party webhooks**: Any webhooks sent to Stripe, Novu, etc. during the broken period are already sent.
- **Cached data**: Vercel Edge Cache may need to be purged separately.

---

## Supabase rollback (last resort)

> Only use this if a migration caused data corruption.

1. Go to: https://supabase.com/dashboard/project/{your-project}/database/backups
2. Find the most recent backup before the breaking migration
3. Contact Supabase support if you need to restore from a backup (this is destructive)

**Write a compensating migration instead whenever possible.**
