# Phase 6: Verify — Acceptance Checklist

## Visual & Content Logic
- [ ] **Third-party isolation:** Unclaimed directory pages explicitly render the `Unverified Third-Party Listing` red warning banner.
- [ ] **Correction workflow:** The "Report Incorrect Info" button points to `/directory/report?slug={slug}` and renders correctly.
- [ ] **Monetization Surfaces:** The `AdGridSponsorSlot` injects successfully natively within the state directory listing on page 1.
- [ ] **Claim Upgrade Pathway:** The `/claim` route explicitly lists premium operational upgrades (Verified Network, Stripe Escrow, Paid Placements) rather than generic lead-gen copy.
- [ ] **Thin Market Fallbacks:** Accessing a state payload with 0 results renders the localized Waitlist UI with valid links to `/loads/new` and Nearby States.
- [ ] **Entity Polymorphism:** Real estate (Hotels, Yards) visually differs from Operators (Wrench/Factory icons vs Trucks/Boxes) via explicit templates.

## Verification Regression Risks
- Verify that Supabase `entity_type` fields match the literal strings `hotel`, `motel`, `yard`, `parking`, `repair`, `installer` as coded in the new `page.tsx` template matcher.
- Verify the routing for `AdGridSponsorSlot` connects to the correct Stripe checkout session via `/sponsor` (Needs Backend confirmation).
