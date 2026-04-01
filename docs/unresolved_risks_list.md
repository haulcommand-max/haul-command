# Phase 6: Verify — Unresolved Risks List

1. **Stripe Workflow Integration:**
   - The UI surfaces (Claim upgrades, AdGrid slots) now explicitly push intent toward Stripe monetization logic. However, the exact checkout routes (`/sponsor` and `/auth/register?intent=claim`) need backend verification to ensure the preauth logic (Feature Flag `stripe_preauth`) correctly provisions premium UI spots.

2. **Entity Type Fragmentation:**
   - Supabase schema does not strictly enforce an enum for `entity_type` inside `provider_directory` or `directory_listings`. The patched `EntityTemplates.tsx` relies on exact string matches (`hotel`, `yard`, `repair`). If the ingestion stack (`ingest-hc-places.js`) uses slightly different keys (e.g. `motel/hotel`, `truck_parking`), the view defaults back to the `Operator` fallback.

3. **SEO Hreflang Tags:**
   - The country/state nested directory effectively powers localized pages, but we have not verified if Next.js Metadata natively injects `hreflang="en-CA"` vs `hreflang="en-US"` correctly based on the `location` outputs for cross-border operators.

4. **Missing Firebase Trigger Alignment:**
   - The original schema specifies an `installs-track` edge function and `notification-dispatch`, meaning push notifications and analytics depend on the exact event payloads. The new buttons ("Report Incorrect Info", "Secure Premium Placement") need to accurately fire `firebase` custom event logs (`search_exit`, `claim_pressure`) or the Analytics Dashboard will miss these monetization signals.
