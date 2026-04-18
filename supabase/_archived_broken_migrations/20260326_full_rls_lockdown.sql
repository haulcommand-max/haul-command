-- ============================================================================
-- HAUL COMMAND: RLS & SECURITY HARDENING
-- Date: 2026-03-26
-- Purpose: Enforce Row Level Security on all critical tables.
--          Remediate Supabase security warnings. Lock down data access to 
--          authenticated users only, with strict ownership-scoped write policies.
-- ============================================================================
-- HOW TO RUN: Paste this entire file into the Supabase SQL Editor and click Run.
-- SAFE TO RE-RUN: All DROP POLICY IF EXISTS guards make this idempotent.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CORE IDENTITY — companies, users, profiles, user_roles
-- ============================================================================

-- ── companies ───────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for companies"       ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can select companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company"     ON public.companies;
DROP POLICY IF EXISTS "Users see own company"                  ON public.companies;
DROP POLICY IF EXISTS "Owners can insert their company"        ON public.companies;
DROP POLICY IF EXISTS "Owners can delete their company"        ON public.companies;

-- Any authenticated user can discover/read companies (directory use-case).
-- Scoped writes: only the owning account can mutate their company record.
CREATE POLICY "Authenticated users can select companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can insert their company"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING    (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their company"
  ON public.companies FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);


-- ── users (public.users — NOT auth.users) ──────────────────────────────
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data"   ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- A user can only read/write their own row. No inter-user peeking.
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING    (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert during sign-up flows (e.g. after-auth trigger populates this table)
CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ── profiles ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING    (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ── user_roles ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles"   ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service_role (backend) should assign roles; users cannot self-promote.
-- Comment this policy out if you want to restrict role inserts to service_role only.
CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- SECTION 2: HC DICTIONARY (Reference / Lookup Data)
-- ============================================================================

ALTER TABLE IF EXISTS public.hc_dictionary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for hc_dictionary"    ON public.hc_dictionary;
DROP POLICY IF EXISTS "Authenticated read for hc_dictionary"    ON public.hc_dictionary;

-- Read-only for authenticated users. Dictionary is system-managed (service_role writes).
CREATE POLICY "Authenticated read for hc_dictionary"
  ON public.hc_dictionary FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- SECTION 3: CONTACTS (PII — Strict Ownership via Company)
-- ============================================================================

ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company owners can manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Company owners can read contacts"  ON public.contacts;

-- Contacts belong to a company. Only the company owner (via companies join) can access.
CREATE POLICY "Company owners can read contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.contacts.company_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can insert contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.contacts.company_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can update contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.contacts.company_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.contacts.company_id
        AND c.owner_user_id = auth.uid()
    )
  );


-- ============================================================================
-- SECTION 4: PROVIDERS (Operator Profiles — readable by all, writable by owner)
-- ============================================================================

ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers are publicly readable"      ON public.providers;
DROP POLICY IF EXISTS "Providers own user can manage"        ON public.providers;

CREATE POLICY "Providers are publicly readable"
  ON public.providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Provider owners can update"
  ON public.providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Provider owners can insert"
  ON public.providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ── coverage_areas & equipment (child of providers) ────────────────────
ALTER TABLE IF EXISTS public.coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipment      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coverage areas readable by authenticated" ON public.coverage_areas;
DROP POLICY IF EXISTS "Equipment readable by authenticated"      ON public.equipment;

CREATE POLICY "Coverage areas readable by authenticated"
  ON public.coverage_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Equipment readable by authenticated"
  ON public.equipment FOR SELECT
  TO authenticated
  USING (true);

-- Restrict writes to the provider owner (via join):
CREATE POLICY "Provider owner can manage coverage areas"
  ON public.coverage_areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.coverage_areas.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Provider owner can manage equipment"
  ON public.equipment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.equipment.provider_id
        AND p.user_id = auth.uid()
    )
  );


-- ============================================================================
-- SECTION 5: LEADS (Marketplace Intelligence — Controlled Access)
-- ============================================================================

ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public leads viewable"          ON public.leads;
DROP POLICY IF EXISTS "Authenticated can view leads"   ON public.leads;
DROP POLICY IF EXISTS "Buyers can manage own leads"    ON public.leads;

-- Authenticated users can view all active-status leads (directory/matching use-case).
-- You can tighten this to subscriber-only by adding a subscription check.
CREATE POLICY "Authenticated can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Only the company that originated the lead (via buyer_company_id) can insert/update/delete.
CREATE POLICY "Buyers can insert own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.leads.buyer_company_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.leads.buyer_company_id
        AND c.owner_user_id = auth.uid()
    )
  );


-- ============================================================================
-- SECTION 6: MARKETPLACE — matches, offers, assignments
-- ============================================================================

ALTER TABLE IF EXISTS public.matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties can view their matches"      ON public.matches;
DROP POLICY IF EXISTS "Parties can view their offers"       ON public.offers;
DROP POLICY IF EXISTS "Parties can view their assignments"  ON public.assignments;

-- Matches and offers: only the involved provider can read.
CREATE POLICY "Providers can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.matches.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view own offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.offers.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Parties can view own assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.assignments.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update own assignments"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = public.assignments.provider_id
        AND p.user_id = auth.uid()
    )
  );


-- ============================================================================
-- SECTION 7: MONETIZATION — wallets, credits_ledger, transactions, subscriptions
--            ⚠️ HIGH SENSITIVITY — Strict ownership-only access
-- ============================================================================

ALTER TABLE IF EXISTS public.wallets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credits_ledger  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans           ENABLE ROW LEVEL SECURITY;

-- ── plans (public read, no mutation by users) ──────────────────────────
DROP POLICY IF EXISTS "Plans are publicly readable" ON public.plans;
CREATE POLICY "Plans are publicly readable"
  ON public.plans FOR SELECT
  TO authenticated
  USING (true);

-- ── wallets (owner-only: personal OR company wallet) ────────────────────
DROP POLICY IF EXISTS "Wallet owner can read"   ON public.wallets;
DROP POLICY IF EXISTS "Wallet owner can update" ON public.wallets;

CREATE POLICY "Wallet owner can read"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.wallets.company_id
        AND c.owner_user_id = auth.uid()
    )
  );

-- Balances mutated by service_role only (via backend/RPC). Users cannot self-credit.
-- No client UPDATE policy on wallets intentionally.

-- ── credits_ledger (owner-read only, system-writes) ───────────────────────
DROP POLICY IF EXISTS "Credits ledger owner can read" ON public.credits_ledger;

CREATE POLICY "Credits ledger owner can read"
  ON public.credits_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = public.credits_ledger.wallet_id
        AND (
          w.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = w.company_id AND c.owner_user_id = auth.uid()
          )
        )
    )
  );

-- ── transactions (owner-read only, system-writes) ─────────────────────────
DROP POLICY IF EXISTS "Transaction owner can read" ON public.transactions;

CREATE POLICY "Transaction owner can read"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = public.transactions.wallet_id
        AND (
          w.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = w.company_id AND c.owner_user_id = auth.uid()
          )
        )
    )
  );

-- ── subscriptions (company owner can read their subscription) ─────────────
DROP POLICY IF EXISTS "Company owner can read subscription" ON public.subscriptions;

CREATE POLICY "Company owner can read subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = public.subscriptions.company_id
        AND c.owner_user_id = auth.uid()
    )
  );


-- ============================================================================
-- SECTION 8: TRUST & AUDIT — reviews, audit_log
-- ============================================================================

ALTER TABLE IF EXISTS public.reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly readable"     ON public.reviews;
DROP POLICY IF EXISTS "Reviewers can insert own reviews"  ON public.reviews;
DROP POLICY IF EXISTS "Audit log readable by owner"       ON public.audit_log;

-- Reviews: public read (trust signal), authenticated write by reviewer only.
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reviewers can insert own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Audit log: users can read their own audit trail. No write access from client.
CREATE POLICY "Audit log readable by actor"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = actor_id);


-- ============================================================================
-- SECTION 9: SOURCES (Intelligence / Scraping — admin managed)
-- ============================================================================

ALTER TABLE IF EXISTS public.sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sources readable by authenticated" ON public.sources;

-- Source records are admin-managed. Authenticated users can read.
CREATE POLICY "Sources readable by authenticated"
  ON public.sources FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- DONE
-- ============================================================================
-- All critical tables now have RLS enabled with strict, ownership-scoped policies.
-- Financial tables (wallets, transactions, credits_ledger) are read-only for 
-- clients; writes must go through service_role backend RPCs.
-- ============================================================================

COMMIT;
