# Phase 4: Patch Plan

## Highest Leverage Patches Executed/To Be Executed

### 1. Entity Templates & Truthfulness (EXECUTED)
**Target:** `app/directory/profile/[slug]/page.tsx`
- Replaced the single monolithic rendering function.
- Created `EntityTemplates.tsx` defining separate templates for `Operator`, `Lodging`, `Yard`, and `Repair` entities.
- Added explicit visual boundaries for Unclaimed / Unverified data to prevent Haul Command from presenting 3rd-party unverified scraped businesses as its own.
- Implemented "Report Incorrect Info" natively on the unclaimed operator flow.

### 2. State Directory & AdGrid Monetization (PENDING)
**Target:** `app/directory/[country]/[state]/page.tsx`
- Inject an `AdGridSponsorSlot` into the category grid.
- Inject dynamic live-proof numbers rather than passive counts (e.g., "7 active verified operators ready for dispatch").
- Maintain thin-market fallback (Request Coverage) but enhance the UI hook for "Waitlist".

### 3. Claim Machine Optimization (PENDING)
**Target:** `app/claim/page.tsx`
- Add operational language: "Claim your profile to rank higher, accept escrowed payments, and dominate {geo}."
- Tie the progression flow to an explicit mention of unlocking premium tools, pushing user intent away from passive directory tracking to active job matching.

### 4. Component Dependencies to Create
- `app/_components/AdGridSponsorSlot.tsx`
- A specific error/report dialog or route to catch corrections.
