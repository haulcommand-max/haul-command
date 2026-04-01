# Phase 1 (P1) Architectural Sign-Off & Execution Blueprint

This document serves as the official Anti-Gravity architectural sign-off for the deferred P0 tasks. The strategic direction is **APPROVED**. The proposed changes represent a maturation from a basic directory structure into an enterprise-grade spatial data platform. 

Here are the strict technical specifications for executing these four initiatives:

---

## 1. Data Correction Engine (`POST /api/directory/report`)
**Status: APPROVED**
**Strategic Value:** Outsourcing data hygiene to the crowd turns stale data into an engagement loop and a high-intent signal for internal sales/claim pushes.

### Execution Spec:
**Database (Supabase):**
Create a new table `entity_data_reports`:
```sql
CREATE TABLE entity_data_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES provider_directory(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id), -- Nullable for anon reports
  issue_category text NOT NULL CHECK (issue_category IN ('CLOSED', 'WRONG_CONTACT', 'WRONG_LOCATION', 'WRONG_TYPE', 'OTHER')),
  proposed_data jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX edr_entity_status_idx ON entity_data_reports(entity_id, status);
```

**API Route (`app/api/directory/report/route.ts`):**
- **Rate Limiting:** Must include IP-based rate limiting (max 3 reports per hour per IP) using Upstash Redis or Supabase edge throttling to prevent competitor sabotage.
- **Action:** Inserts the report. If the `reporter_id` is an authenticated user with a trust score > 0.80, bypass manual review and flag the entity state to `PARTIALLY_VERIFIED_PENDING_CLAIM`.
- **Webhook:** Trigger a Slack/Discord notification or internal Novu event for the Admin team to review high-value entity reports.

---

## 2. Global `<SponsorInventoryModule />` (AdGrid Integration)
**Status: APPROVED**
**Strategic Value:** Centralizes monetization logic. Instead of hardcoding "Waitlists" or "Sponsor Slots" in various templates, a single programmatic component intercepts intents and checks live inventory.

### Execution Spec:
**Component Interface (`app/_components/directory/SponsorInventoryModule.tsx`):**
```tsx
interface SponsorModuleProps {
  placementKey: string; // e.g., 'TX_I10_ESCORT_TOP', 'FL_MIAMI_HOTEL'
  geoState: string;
  category: 'operator' | 'hotel' | 'yard' | 'repair' | 'permit';
  fallbackMode: 'WAITLIST' | 'CLAIM_COVERAGE' | 'POST_LOAD';
}
```
**Architecture:**
- **Server Component:** The module queries `SELECT 1 FROM sponsor_leases WHERE placement_key = ? AND active = true AND expires_at > now()`.
- **Logic:** 
  1. If active lease exists: Render the Sponsored Entity Card.
  2. If NO active lease AND volume > threshold: Render "Own this Slot" (AdGrid Stripe Checkout).
  3. If NO active lease AND volume < threshold: Render `fallbackMode` (e.g., Post a Load).
- **Stripe Hook:** The "Own this Slot" CTA passes the `placementKey` directly to `POST /api/stripe/create-checkout`, configuring a recurring subscription tied uniquely to that geo-slot.

---

## 3. `vw_geo_claim_density` Tracking View
**Status: APPROVED**
**Strategic Value:** Essential for Haul Command's internal sales team and programmatic AdGrid pricing. We must know the exact ratio of claimed vs. scraped data per state/category to price ads dynamically.

### Execution Spec:
**Supabase SQL Blueprint:**
We must differentiate operators (moving supply) from infrastructure (static utility).
```sql
CREATE OR REPLACE VIEW vw_geo_claim_density AS
SELECT 
  state,
  city,
  -- Infrastructure (Yards, Hotels, Repair, Permitting)
  COUNT(*) FILTER (WHERE entity_type IN ('yard','hotel','motel','repair','parking','permit')) AS total_infra,
  COUNT(*) FILTER (WHERE entity_type IN ('yard','hotel','motel','repair','parking','permit') AND coverage_status = 'live' AND verified = true) AS claimed_infra,
  
  -- Operations (Escorts/Pilot Cars)
  COUNT(*) FILTER (WHERE entity_type IN ('operator', 'broker')) AS total_operators,
  COUNT(*) FILTER (WHERE entity_type IN ('operator', 'broker') AND coverage_status = 'live' AND verified = true) AS claimed_operators,

  -- Overall Health
  ROUND(
    (COUNT(*) FILTER (WHERE verified = true))::numeric / GREATEST(COUNT(*), 1)::numeric * 100, 
    2
  ) as overall_claim_percentage,
  
  MAX(updated_at) as last_activity
FROM provider_directory
GROUP BY state, city;
```
*Note: This view should be materialized (`CREATE MATERIALIZED VIEW`) and refreshed via a daily cron (`SELECT cron.schedule('0 2 * * *', $$REFRESH MATERIALIZED VIEW vw_geo_claim_density$$);`) since spatial aggregates are expensive on every page load.*

---

## 4. `place/[id]` Architecture Migration
**Status: APPROVED**
**Strategic Value:** Slugs are fragile. Company names change, URLs break, and SEO juice leaks. UUIDs (`id`) are permanent. Transitioning to `place/[id]` mimics standard aggregator architecture (e.g., Google Maps `/place/ChIJ...`).

### Execution Spec:
**Migration Path:**
1. **Routing:** Create `app/place/[id]/page.tsx`.
2. **Template Transfer:** Move `EntityTemplates.tsx` and the master render logic from `directory/profile/[slug]` to `place/[id]`.
3. **SEO Canonical & Redirects (CRITICAL):**
   - Modify `next.config.ts` (or middleware) to implement a permanent HTTP 301 redirect from `/directory/profile/:slug` to `/place/:id`. 
   - `app/api/redirect-slug/route.ts` may be needed to lookup the UUID by slug dynamically if hardcoded redirects aren't feasible.
   - The Canonical Link tag on `place/[id]` must strictly trace back to `https://haulcommand.com/place/[id]`.
4. **Link Graph Update:** All components (Sitemaps, Geo Grids, Search Results) must swap `href={'/directory/profile/${slug}'}` to `href={'/place/${id}'}`.

### Final Authorization
You have full authorization to move these out of deferred status and begin injecting this architecture into the application stack.
