-- ============================================================================
-- HAUL COMMAND: RLS & SECURITY HARDENING (TRUE SCHEMA FIX)
-- Date: 2026-03-26
-- Purpose: Enforce Row Level Security on all critical tables using the ACTUAL
--          database schema instead of the hallucinated one.
-- ============================================================================

BEGIN;

-- ── 1. USERS (public schema) ───────────────────────────────────────────────
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ── 2. PROFILES ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 3. VENDORS (Companies) ──────────────────────────────────────────────────
-- Vendors replaces 'companies' as the primary business entity
ALTER TABLE IF EXISTS public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for vendors" ON public.vendors;
DROP POLICY IF EXISTS "Owners can manipulate their vendor record" ON public.vendors;

CREATE POLICY "Public read access for vendors"
  ON public.vendors FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Owners can manipulate their vendor record"
  ON public.vendors FOR ALL
  TO authenticated USING (auth.uid() = owner_user_id);


-- ── 4. WALLETS (Financials) ─────────────────────────────────────────────────
-- Wallets only have user_id, no company_id
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wallet owner can read" ON public.wallets;

CREATE POLICY "Wallet owner can read"
  ON public.wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);


-- ── 5. HC DICTIONARY (Reference Data) ───────────────────────────────────────
ALTER TABLE IF EXISTS public.hc_dictionary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for hc_dictionary" ON public.hc_dictionary;

CREATE POLICY "Public read access for hc_dictionary"
  ON public.hc_dictionary FOR SELECT
  USING (true);


-- ── 6. PROVIDERS (Scraped Public Directory) ─────────────────────────────────
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers are publicly readable" ON public.providers;

CREATE POLICY "Providers are publicly readable"
  ON public.providers FOR SELECT
  USING (true);


-- ── 7. AUDIT LOG ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own audit logs" ON public.audit_log;

CREATE POLICY "Users can read own audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated USING (auth.uid() = actor_user_id);


-- ── 8. USER ROLES ───────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

COMMIT;
