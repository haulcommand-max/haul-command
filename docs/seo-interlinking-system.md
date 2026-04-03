# Haul Command — Global SEO Interlinking Dominance System
## Implementation Guide

> **Commit:** `lib/seo/interlinking-graph.ts` + `components/seo/RelatedLinks.tsx` + `scripts/seo/orphan-audit.ts`

---

## Architecture

```
lib/seo/interlinking-graph.ts
  ├─ PAGE_EQUITY_WEIGHT    — How much SEO juice each page type carries
  ├─ LINK_GRAPH            — What each page type must link to
  ├─ STATIC_LINKS          — Default always-on links per page type
  ├─ US_STATE_ADJACENT     — Adjacent state links for regulation pages
  ├─ TOOL_CROSS_LINKS      — Tool → tool cross-links
  ├─ HOMEPAGE_LINKS        — Homepage link set (highest authority)
  ├─ NOINDEX_PATHS         — Excluded from link flow
  └─ getRelatedLinks()     — Call this in any page component

components/seo/RelatedLinks.tsx
  └─ Drop-in footer link strip — add to every indexable page

scripts/seo/orphan-audit.ts
  └─ Run periodically to detect orphan pages and noindex leaks
```

---

## Link Equity Flow (Priority Order)

```
TOOLS (1.00) → REGULATIONS (0.90) → GLOSSARY (0.80)
     ↓                    ↓                ↓
DIRECTORY (0.75) ←────────────────────────────
     ↓
CORRIDOR (0.70) → ROLE (0.65) → LEADERBOARD (0.60)
     ↓
PROFILE (0.50) → COUNTRY (0.45)
```

Flow rule: High-equity pages always link down toward revenue pages.
Revenue pages send equity back up toward discovery pages.

---

## How to Wire a Page

### Step 1: Import RelatedLinks
```tsx
import RelatedLinks from '@/components/seo/RelatedLinks';
```

### Step 2: Add at bottom of page (before footer)

**Tool page (escort-calculator):**
```tsx
<RelatedLinks
  pageType="tool"
  context={{ toolSlug: 'escort-calculator' }}
  heading="Related tools and resources"
/>
```

**Regulation page (Texas escort requirements):**
```tsx
<RelatedLinks
  pageType="regulation"
  context={{ state: 'TX' }}
  heading="Texas heavy haul resources"
/>
```

**Directory page:**
```tsx
<RelatedLinks pageType="directory" />
```

**Corridor page:**
```tsx
<RelatedLinks
  pageType="corridor"
  context={{ corridor: 'i-10' }}
  heading="I-10 corridor resources"
/>
```

**Leaderboard page:**
```tsx
<RelatedLinks pageType="leaderboard" />
```

### Step 3: Run orphan audit after adding new pages
```bash
npx ts-node scripts/seo/orphan-audit.ts
```

---

## Implementation Checklist — Pages to Wire First

| Page | pageType | Priority | Status |
|---|---|---|---|
| `/tools/escort-calculator` | `tool` | ⚠️ P0 | Wire now |
| `/tools/permit-checker` | `tool` | ⚠️ P0 | Wire now |
| `/tools/bridge-weight` | `tool` | ⚠️ P0 | Wire now |
| `/tools/cost-calculator` | `tool` | ⚠️ P0 | Wire now |
| `/directory` | `directory` | ⚠️ P0 | Wire now |
| `/leaderboards` | `leaderboard` | ✅ Done | Wired in page fix |
| `/loads` | `load` | P1 | Wire next |
| `/corridors` | `corridor` | P1 | Wire next |
| `/roles/pilot-car-operator` | `role` | P1 | Wire next |
| `/roles/broker` | `role` | P1 | Wire next |
| `/roles/heavy-haul-carrier` | `role` | P1 | Wire next |
| `/directory/[country]/...` | `country` | P2 | Wire with country expansion |
| `/glycossary/*` | `glossary` | P2 | Wire next |
| `/blog/*` | `blog` | P3 | Wire next |

---

## Global 120-Country Hierarchy

Every country page must connect to the 3-click chain:

```
/directory/[country]
  └─ /directory/[country]/[state-or-region]
       └─ /directory/[country]/[state]/[city]
            └─ /directory/profile/[id]

✓ Country page links to: national directory, regional tools page,
  international escort requirements, corridor data for that country
✓ Regional page links to: country page, city listings, regulations
✓ City page links to: operators in city, surrounding regions, tools
✓ Profile links back to: city, region, country, corridors served
```

---

## Anchor Text Rules

| Pattern | Example | Notes |
|---|---|---|
| ✅ Location-specific | `pilot car services in Texas` | Best for local SEO |
| ✅ Action-keyword | `calculate escort requirements` | Tool intent |
| ✅ Entity-specific | `I-10 corridor operators` | Corridor authority |
| ❌ Generic | `click here`, `learn more`, `read more` | Never use |
| ❌ Over-optimized | `best cheapest escort car Texas 2026` | Avoid stuffing |

---

## SEO Control Rules

### noindex pages (never link to these from indexable pages)
```
/admin, /dashboard, /auth, /onboarding, /dev, /accept, /quickpay
```

### Canonical rules
- Dynamic pages (`/directory/[country]`) must include `<link rel="canonical">` pointing to the canonical URL
- Country pages with multiple URL patterns (e.g., `/us` and `/directory/us`) must canonical to one
- Paginated directory results must canonical to the base directory URL

### Orphan prevention rule
**Before adding any new page:**
1. Add at least one inbound link from an existing high-equity page
2. Add `<RelatedLinks pageType="...">` to the new page
3. Run orphan audit

---

## Optimization Loop

Run weekly:
```bash
# Detect orphans
npx ts-node scripts/seo/orphan-audit.ts

# Check which pages rank (pull from Google Search Console API)
# Check which pages convert (pull from analytics)
# Increase RelatedLinks toward high-converting under-linked pages
```
