# ANTI-GRAVITY DEPLOYMENT MANIFEST
**Target**: `hvjyfyzotqobfkakjozp`

Use these exact commands to push the Fortune 5 architecture to production.

### 1. Link Project (Interactive)
```bash
npx supabase link --project-ref hvjyfyzotqobfkakjozp
```
*(Enter your DB password if prompted)*

### 2. Push Database Schema (21 Migrations)
This builds the entire backend (Leaderboards, Trust Scores, Gating).
```bash
npx supabase db push
```

### 3. Deploy Edge Functions (Logic Layer)
Deploys the 6 Killer Functions + Admin Setters.
```bash
npx supabase functions deploy --no-verify-jwt
```

### 4. Set Secrets (Production Environment)
These are critical for the Edge Functions to work.
```bash
npx supabase secrets set SUPABASE_URL=https://hvjyfyzotqobfkakjozp.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
*(Find your Service Role Key in Supabase Dashboard -> Project Settings -> API)*

### 5. Launch Frontend (Local Dev)
Verify everything works before Vercel deploy.
```bash
npm run dev
```

---
**VERCEL DEPLOYMENT (Next Step)**
1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Add the same Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
