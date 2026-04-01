# Phase 1: System Inventory

## Exact Routes Inspected
- `app/directory/[country]/[state]/page.tsx` (State Directory listing)
- `app/directory/profile/[slug]/page.tsx` (Entity Profile page)
- `app/claim/page.tsx` (Claim Funnel)

## Exact Components Inspected
- `CategoryGrid`
- `StateComplianceCalculator`

## Exact DB Objects Inspected (via SCHEMA.md)
- `provider_directory` (Canonical provider tables & Geo queries)
- `directory_listings` (Fallback tables)
- `profiles` (User data)

## Exact Integrations Inspected
- Next.js Metadata (Found functioning dynamic metadata for SEO)
- Stripe UI paths (Found absent in claim flow)

## Exact Page Families Found
- Directory Hierarchy (Country -> State -> Profile)
- Compliance Rules Engine
- Claim Engine Surface
