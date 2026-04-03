# Corridor Intelligence Productization
# Skill #5 — package route/permit/load data as a paywall product
#
# STATUS: DataProductEngine already exists (app/api/data-products/route.ts)
# with teaser/purchase flow and Stripe integration.
# This document defines the PRODUCT CATALOG for corridor intelligence
# and the paywall architecture to activate revenue.
# ════════════════════════════════════════════════════════════

## What Already Exists

- `app/api/data-products/route.ts` — teaser + purchase API, wired to Stripe
- `lib/monetization/data-product-engine.ts` — `DataProductEngine` class (pending catalog)
- `app/api/corridor/forecast` — corridor forecast sub-route
- `app/api/corridor/segments` — corridor segment sub-route
- `app/api/corridor/sponsor` — corridor sponsor sub-route

The engine is built. **The catalog is empty.** This is what we're defining now.

---

## Product Catalog

### Product 1: Corridor Intelligence Report

```typescript
// Add to DATA_PRODUCT_CATALOG in lib/monetization/data-product-engine.ts

{
  id: 'corridor-report',
  name: 'Corridor Intelligence Report',
  slug: 'corridor-report',
  description: 'Full lane analysis for a specific corridor: operator density, permit requirements, escort thresholds, demand temperature, historical load volume, and recommended operators.',
  price_usd: 19,
  stripe_price_id: 'TODO:price_xxx_corridor_report',
  included_in_plans: ['professional', 'elite', 'enterprise'],
  scope: 'corridor',             // Requires corridor_code
  teaser_fields: [
    'corridor_name',
    'operator_count',             // "12 operators serve this corridor"
    'demand_band',                // "Hot" (hide specifics)
    'top_state_count',            // "Crosses 3 states"
  ],
  full_report_fields: [
    'corridor_name',
    'corridor_code',
    'states_crossed',
    'permit_requirements_by_state',
    'escort_thresholds_by_state',
    'operator_density_score',
    'active_operator_count',
    'top_operators_preview',      // First 3 with contact
    'demand_temperature',
    'surge_score',
    'load_volume_30d',
    'avg_escort_count_required',
    'seasonal_pattern',
    'recommended_permit_sequence',
  ],
  refresh_frequency: 'weekly',
  format: 'json + pdf_export',
}
```

### Product 2: State Permit Requirements Pack

```typescript
{
  id: 'state-permit-pack',
  name: 'State Permit Requirements Pack',
  slug: 'state-permit-pack',
  description: 'Complete oversize/overweight permit requirements for a specific US state: weight limits, dimension thresholds, escort rules, travel hour restrictions, bond requirements, and fee schedule.',
  price_usd: 9,
  stripe_price_id: 'TODO:price_xxx_state_permit_pack',
  included_in_plans: ['professional', 'elite', 'enterprise'],
  scope: 'country_state',        // Requires country_code + state_code
  freshness_label: 'Verified Q1 2026',
  teaser_fields: [
    'state_name',
    'max_weight_legal',           // "80,000 lbs (legal)"
    'requires_escort',            // true/false (no thresholds)
    'freshness_label',
  ],
  full_report_fields: [
    'state_name',
    'weight_limits_by_axle',
    'dimension_thresholds',       // width, height, length at which escort required
    'escort_rules',               // front only / front + rear / flags only
    'travel_hour_restrictions',   // e.g., "No Sunday travel"
    'permit_fee_schedule',
    'bond_requirements',
    'contact_agency',
    'regulation_source_url',
    'last_verified_date',
    'confidence_state',           // 'verified' | 'estimated' | 'user_reported'
  ],
  refresh_frequency: 'quarterly',
  format: 'json + pdf_export',
}
```

### Product 3: Lane Intelligence Bundle

```typescript
{
  id: 'lane-bundle',
  name: 'Lane Intelligence Bundle',
  slug: 'lane-bundle',
  description: 'Full origin-to-destination lane analysis covering all states on the route, permit sequence, escort handoff points, total estimated permit cost, and operator recommendations at each segment.',
  price_usd: 49,
  stripe_price_id: 'TODO:price_xxx_lane_bundle',
  included_in_plans: ['elite', 'enterprise'],
  scope: 'origin_destination',   // Requires origin + destination
  teaser_fields: [
    'states_on_route',
    'estimated_permit_count',
    'estimated_escort_count',
    'route_complexity_band',      // 'Simple' | 'Moderate' | 'Complex'
  ],
  full_report_fields: [
    'origin',
    'destination',
    'recommended_route',
    'states_on_route',
    'segment_breakdown',
    'permit_sequence',
    'escort_handoff_points',
    'total_estimated_permit_cost',
    'total_escort_segments',
    'estimated_transit_days',
    'recommended_operators_by_segment',
    'known_restrictions',         // Low bridges, weight restrictions
    'seasonal_advisories',
  ],
  refresh_frequency: 'on_demand',
  format: 'json + pdf_export',
}
```

### Product 4: Operator Density Heatmap (API)

```typescript
{
  id: 'density-api',
  name: 'Operator Density API',
  slug: 'density-api',
  description: 'API access to operator density data by geo bounding box. For TMS vendors, fleet managers, and route planners. Returns operator count, demand pressure, and top operators per region.',
  price_usd: null,               // Enterprise only
  stripe_price_id: null,
  included_in_plans: ['enterprise'],
  scope: 'api_subscription',
  format: 'json_api',
  rate_limits: {
    requests_per_day: 1000,
    requests_per_minute: 20,
  },
}
```

---

## Teaser Architecture (Free → Paid Gate)

```
[User lands on /tools/escort-calculator]
  → Calculates: "2 escorts required in Texas"
  → Post-result teaser: "Want the full Texas permit pack?"
    → Shows: state name, legal max weight, requires escort: true
    → Hides: all thresholds, travel restrictions, fee schedule
  → CTA: "Get Texas Permit Pack — $9 →"
    → Or: "Included free with Professional plan →"

[User lands on /directory?corridor=I-10]
  → Sees corridor demand band: 🔥 Hot
  → Teaser: "12 operators on I-10. View full corridor report →"
    → Shows: operator count, demand band
    → Hides: specific operators with contact, permit requirements
  → CTA: "Corridor Report — $19" or "Included with Professional →"
```

---

## Paywall Surface Map

| Surface | Teaser Shown | Gate trigger | Product |
|---|---|---|---|
| `/tools/escort-calculator` (post-result) | State name + yes/no escort | "Full permit pack" button | state-permit-pack |
| `/escort-requirements/[state]` (below fold) | Weight limit only | "Full requirements" | state-permit-pack |
| `/directory?corridor=X` header | Operator count + demand band | "Corridor report" strip | corridor-report |
| `/tools/cost-calculator` (post-result) | Route complexity band | "Full lane bundle" | lane-bundle |
| `/api/density` (API consumers) | — | Auth gate | density-api (Enterprise) |

---

## Revenue Projection

```
Assumptions (conservative):
  Monthly calculator uses:         10,000
  Teaser conversion rate:          2%
  Average product price:           $14

  Monthly data product revenue:    $2,800 / month
  + Professional plan upsell at 1% of calculator users = 100 × $149 = $14,900 / month

Total incremental monthly revenue from this skill: ~$17,700 (month 1)
Scales with traffic linearly.
```

---

## Implementation Order

```
1. [ ] Add 4 products to DATA_PRODUCT_CATALOG in lib/monetization/data-product-engine.ts
2. [ ] Create Stripe products for corridor-report ($19), state-permit-pack ($9), lane-bundle ($49)
3. [ ] Replace TODO:price_xxx placeholders with real Stripe price IDs
4. [ ] Wire escort-calculator post-result CTA to /api/data-products?action=teaser
5. [ ] Wire /escort-requirements/[state] below-fold to state permit teaser
6. [ ] Wire /directory corridor header to corridor report teaser
7. [ ] Build PDF export endpoint: /api/data-products/[id]/pdf
8. [ ] Add DataProductEngine.getProductsByCountry() for Tier B-E international markets
9. [ ] Add contract test for /api/data-products in api-contracts.spec.ts
```
