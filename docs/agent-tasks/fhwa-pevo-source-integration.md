# FHWA PEVO Source Integration Notes

## Source

- Title: Pilot/Escort Vehicle Operators Training Manual
- Agency: Federal Highway Administration Office of Operations
- Publication: FHWA HOP-16-050
- Publication date: February 2017
- URL: https://ops.fhwa.dot.gov/publications/fhwahop16050/index.htm
- Scope: United States federal training reference

## How to use this source

Use this FHWA manual as a U.S.-specific authority backbone for Haul Command training, glossary, safety, route survey, and PEVO beginner content.

Good uses:

- PEVO training structure
- Operator role definitions
- Certification and reciprocity education
- Escort vehicle equipment education
- Route planning
- Route surveys
- Pre-trip planning
- Permit and route review
- Trip operations
- Lead and rear pilot/escort role education
- Traffic control education
- Railroad crossing safety
- Emergency procedures
- Post-trip reports
- Trip logs
- Driver safety modules

Do not use it for:

- Current state-by-state legal thresholds without verification
- Global pilot car rules
- Country-specific requirements outside the United States
- Legal advice
- Permit issuance authority

## Repo changes already made

Migration added:

- `supabase/migrations/20260429_121_fhwa_pevo_training_source.sql`

This migration adds:

- `public.hc_authority_sources`
- FHWA source record: `fhwa-hop-16-050-pevo-training-manual`
- FHWA-aligned training course seeds
- Source-backed glossary terms

## Agent instructions

When building or editing these pages, pull this source from `hc_authority_sources` or cite the URL directly if the data layer is not available in local dev:

- `/what-is-a-pilot-car`
- `/training/what-is-a-pilot-car`
- `/safety/how-to-drive-near-an-oversize-load`
- `/safety/why-pilot-cars-block-traffic`
- `/safety/warning-triangles-vs-beacons`
- `/glossary/pilot-escort-vehicle-operator`
- `/glossary/route-survey`
- `/glossary/pre-trip-safety-meeting`
- `/glossary/trip-log`
- `/glossary/traffic-control-authority`

Every FHWA-backed page must show:

- Source title
- Agency
- Publication number
- Source URL
- Last reviewed date
- Scope warning: U.S.-specific training reference; state/local overlays required

Do not copy long FHWA text verbatim. Use short attribution and Haul Command's own explanation.
