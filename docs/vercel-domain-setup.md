# Vercel + GoDaddy Domain Setup — haulcommand.com

> Complete guide to connect haulcommand.com (GoDaddy) to your Vercel deployment.  
> Takes 5–15 minutes. SSL is automatic once DNS propagates.

---

## Step 1 — Deploy on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)** → log in with GitHub
2. Click **Import** next to your `haul-command` (or `haulcommand-max`) repo
3. Vercel auto-detects Next.js — leave all defaults
4. Click **Deploy** — you'll get a `.vercel.app` preview URL in ~60 seconds

> Your `vercel.json` and `next.config.ts` are already correctly configured.  
> Just hit Deploy — no settings to change.

---

## Step 2 — Add haulcommand.com in Vercel Dashboard

1. Open your project in the Vercel dashboard
2. Go to **Settings → Domains**
3. Type `haulcommand.com` → click **Add**
4. Also add `www.haulcommand.com` (Vercel handles the redirect automatically via your `next.config.ts`)

Vercel will show you the exact DNS records to set. They'll look like the values below.

---

## Step 3 — Update DNS in GoDaddy

Log in to [GoDaddy DNS Manager](https://dcc.godaddy.com/control/portfolio/haulcommand.com/settings).

### A Record (root domain)

| Type | Name | Value         | TTL      |
|------|------|---------------|----------|
| A    | @    | 76.76.21.21   | 1 Hour   |

> This points `haulcommand.com` to Vercel's edge network.

### CNAME Record (www subdomain)

| Type  | Name | Value                  | TTL      |
|-------|------|------------------------|----------|
| CNAME | www  | cname.vercel-dns.com   | 1 Hour   |

> `www.haulcommand.com` will 301 redirect to `haulcommand.com` automatically.

---

## Step 4 — Wait for SSL (automatic, ~5 min)

Vercel provisions a free Let's Encrypt SSL certificate automatically once it detects your DNS records.

In your Vercel dashboard (**Settings → Domains**) you'll see:

- ✅ **Valid Configuration** — DNS is correct
- ✅ **SSL Certificate** — HTTPS is active

---

## Step 5 — Verify Live

```bash
# Check A record resolved
nslookup haulcommand.com
# Should show: 76.76.21.21

# Check HTTPS
curl -I https://haulcommand.com
# Should return: HTTP/2 200
```

Or just open `https://haulcommand.com` in a browser.

---

## Step 6 — Enable Vercel Analytics (free, 30 seconds)

In the Vercel dashboard → **Analytics** tab → Enable.

Also enable **Speed Insights** (same tab).

Both are free on Hobby plan and give you user flow data that will drive AdGrid pricing later.

---

## Environment Variables (required before deploying)

In Vercel dashboard → **Settings → Environment Variables**, add:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role |
| `NEXT_PUBLIC_FIREBASE_CONFIG` | Firebase Console → Project Settings → Web App config (JSON) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Service Accounts → Generate key (JSON) |
| `HERE_API_KEY` | [developer.here.com](https://developer.here.com) → Projects → API Keys |
| `NEXT_PUBLIC_HERE_API_KEY` | Same as above (public client key) |
| `NEXT_PUBLIC_APP_URL` | Set to `https://haulcommand.com` |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` |

> See `.env.example` in the repo root for the full list with descriptions.

---

## Common Issues

| Problem | Fix |
|---|---|
| Vercel shows "Invalid Configuration" | DNS hasn't propagated yet — wait 10 min, then re-check |
| www doesn't redirect | Make sure CNAME record is `www` → `cname.vercel-dns.com` (not an A record) |
| Build fails | Check Vercel build logs. Most common: missing env var. Add in Vercel → Settings → Env Vars |
| Supabase auth fails | Add `haulcommand.com` to Supabase → Auth → URL Configuration → Site URL |
| Firebase push broken | Add `haulcommand.com` to Firebase → Auth → Authorized Domains |

---

## Post-Deploy Checklist

- [ ] `https://haulcommand.com` loads (no mixed content warnings)
- [ ] `https://www.haulcommand.com` → redirects to `https://haulcommand.com`
- [ ] Supabase Site URL updated to `https://haulcommand.com`
- [ ] Firebase Authorized Domains updated
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled
- [ ] Run Lighthouse: target 90+ Performance, 100 SEO
