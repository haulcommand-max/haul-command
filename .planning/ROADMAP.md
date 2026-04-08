# Roadmap: Haul Command Infrastructure

## Milestone 1: Production Polish & Security Validation (Current)
This milestone focuses on resolving any lingering PostgREST integration issues, validating the Stripe and Firebase implementations, and securing the 120-country ingestion pipelines.

### Phase 1: Database Ingestion Verification
Test and ensure that `country_ingest_queue` and `regulation_sources` are accessible from Vercel via PostgREST and RLS policies are properly scoped for the `anon` client and Edge functions.
[ ] Pending

### Phase 2: Schema Data Pipeline Check
Attach the Resource Hub UI filters dynamically to the Supabase data models to power the full document library.
[ ] Pending

### Phase 3: Automated Worker Deploy
Deploy and scale the autonomous workers (e.g. Fly.io deployment config constraints) so the platform auto-indexes Tier 1 ("Gold Tier") regulatory domains natively over HTTP.
[ ] Pending
