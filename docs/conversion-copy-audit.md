# Haul Command — Conversion Copy & CTA Audit
# Skill #2 — Conversion copy / offer ladders / CTA clarity
#
# This document covers:
#   1. Money page CTA audit (current state → recommended)
#   2. Offer ladder design per page
#   3. Copy principles for industrial/logistics buyers
#   4. Implementation-ready copy blocks for each page
# ════════════════════════════════════════════════════════════

## Conversion Principles for Heavy-Haul Industrial Buyers

Industrial buyers are:
- Time-pressured (they have a load sitting in a yard)
- Risk-averse (regulatory violations = fines, delays)
- Trust-driven (they book based on credentials, not aesthetics)
- Action-oriented (they want to find + contact, not browse)

**Copy rules:**
1. Lead with specificity, not category ("Pilot car in Texas" > "Find escort services")
2. Surface the trust signal before the CTA (rating, verification before "Contact")
3. Use urgency that's real, not fake (corridor demand signals, not generic "limited time")
4. One primary CTA per screen. Don't make them choose.
5. The ask should match the readiness ("View Profile" before "Book Now")

---

## Page 1: Homepage `/`

### Current State (assumed)
- Generic hero headline
- Generic CTA (likely "Get Started" or "Find Operators")
- No urgency or specificity

### Recommended Offer Ladder
```
Level 1 — Awareness:  "Find escort operators in [state] in 60 seconds"
Level 2 — Interest:   "Browse 18,000+ verified operators across 120 countries"
Level 3 — Intent:     "Search your corridor →"
Level 4 — Action:     "Contact an operator" (on profile page)
Level 5 — Convert:    "Get verified + listed" (operator CTA)
```

### Hero Copy Block (Shipper/Buyer angle)
```
Headline:  "Find your escort operator before the load runs cold."
Subline:   "18,000+ verified pilot car operators, carriers, and permit specialists.
            Search by corridor, state, or load type."
CTA:       [Search Your Corridor →]
Trust bar: "✓ FMCSA verified  ✓ 120 countries  ✓ Real-time availability in hot markets"
```

### Hero Copy Block (Operator/Supply angle — below fold or tab)
```
Headline:  "Get found by shippers running your corridor."
Subline:   "Buyers search Haul Command first. Your listing is your inbound pipeline."
CTA:       [List Your Business Free →]
Social:    "Join 18,000+ operators already listed"
```

---

## Page 2: `/directory`

### Current State (assumed)
- Search results with listing cards
- CTA on card: probably generic "View" or "Contact"
- No urgency signals, no tier differentiation visible

### Card CTA Upgrade
Replace generic with intent-specific:
```
❌ "View"
✅ "See Profile + Contact →"

❌ "Contact"
✅ "Get a Quote" (for paid/verified operators)
✅ "Check Availability" (when live availability data present)
✅ "View Credentials" (for compliance buyers)
```

### Scarcity / Urgency Signals (when corridor data available)
```
🔥 "3 operators available in this corridor right now"
⚡ "High demand — TX-LA corridor this week"
📍 "Only 2 verified operators within 50mi of Dallas"
```

### Offer Ladder within Directory
```
Free user:   See name, state, basic services → CTA: "Create free account to see contact info"
Logged in:   See full profile → CTA: "Get a Quote"
Paid tier:   Priority placement + call-to-action badge
```

### Filter Sidebar Upgrade
Add value-signal filters:
```
☑ FMCSA Verified only
☑ Available this week
☑ Elite / Verified badge
☑ Rated 4.5+
```

---

## Page 3: `/tools/escort-calculator`

### Current State (assumed)
- Form with dimension inputs
- Output: number of escorts required
- CTA after result: likely nothing, or generic

### Post-Calculation CTA (highest-intent moment)
```
Result banner:
  "Your load (14'W x 14'H x 75'L) requires 2 escort vehicles in Texas."
  
  Primary CTA:   [Find Escort Operators in Texas →]
  Secondary CTA: [Check Permit Requirements for TX →]
  Trust line:    "Results based on current TXDOT regulations — verified Q1 2026"
```

### Offer Ladder for Calculator Page
```
Level 1 — Free tool:  Calculator result (everyone gets this)
Level 2 — Teaser:     "Want a PDF escort requirements report for this route?" → email capture
Level 3 — Paid:       "Full corridor compliance report — $19" OR included with Professional plan
Level 4 — Directory:  "Find certified escort operators for this exact load →"
```

### Calculator Page Hero
```
Headline:  "How many escort vehicles does your load need?"
Subline:   "Enter your load dimensions and state — get instant results based on current regulations."
Trust:     "✓ Updated Q1 2026  ✓ Covers all 50 US states  ✓ Used by 10,000+ operators"
```

---

## Page 4: `/escort-requirements`

### Current State (assumed)
- Static or semi-static requirements content by state
- Low or no CTA

### Recommended CTAs
```
Primary:   [Find Escort Operators for This State →]   (links to /directory?state=XX)
Secondary: [Use the Escort Calculator →]              (cross-link to tool)
Tertiary:  [Download State Requirements PDF]           (email capture / paywall)
```

### Freshness Trust Signal (implement with legal-freshness skill #13)
```
📅 "Last verified: March 2026 — Texas DOT regulations"
⚠️  "Regulations change. Always confirm with your permit agent before moving."
```

---

## Page 5: `/leaderboards`

### Current State (assumed)
- Rankings table
- No operator CTA, no buyer CTA

### Dual-CTA Strategy
```
For BUYERS viewing leaderboard:
  CTA near top 3: "Contact this operator →"
  Trust signal:   "#1 ranked based on verified jobs, FMCSA status, and rating"

For OPERATORS viewing leaderboard:
  CTA in sidebar: "Where do you rank? Claim your listing →"
  Gamification:   "Climb with more verified jobs, credentials, and reviews"
```

### Leaderboard Page Hero
```
Headline:  "The most trusted operators in heavy haul."
Subline:   "Ranked by verified jobs completed, FMCSA status, ratings, and corridor expertise."
Op CTA:   [See where you rank →]
Buyer CTA: [Contact a top operator →]
```

---

## Page 6: `/roles/pilot-car-operator`

### Current State (assumed)
- Informational content about the role
- Low conversion intent

### Conversion Angle
```
For someone reading this page, two intents exist:
  A. "I want to become a pilot car operator" → start here, get listed
  B. "I need to hire a pilot car operator" → find one now

Hero:
  Headline: "Pilot Car Operators: The professionals who move oversized America."
  Subline:  "Find certified pilot car operators near you, or join 18,000+ listed on Haul Command."
  CTA A:    [Find Operators →]   (buyer)
  CTA B:    [Get Listed Free →]  (supply)
```

---

## Universal CTA Rules (apply sitewide)

```
✅ DO:
  - Use corridor/state-specific CTAs when location data available
  - Surface trust signals (verification badge, rating, FMCSA) within 50px of CTA
  - Make primary CTA the highest-contrast element in any section
  - Use action verbs: Find, Get, Contact, Verify, Calculate — not View, Click, Submit
  - Add social proof near CTAs: "Joined by 18,000+ operators"

❌ DON'T:
  - Use "Learn More" as a primary CTA on intent pages
  - Stack more than 2 CTAs per visible screen area
  - Use countdown timers unless urgency is real (corridor surge data)
  - Make the form the first thing a user sees on a tool page
```

---

## Offer Ladder — Platform-Wide

```
FREE TIER (anonymous):
  - See listings (limited info)
  - Use calculator
  - View escort requirements
  - See leaderboard (top 10)
  CTA: "Sign up free to see contact info"

FREE ACCOUNT:
  - See full listing contact info
  - Save searches
  - Download calculator results
  CTA: "List your business — it's free"

STARTER ($49/mo):
  - 1 listing with contact visible
  - Standard directory placement
  CTA: "Get found in your state"

PROFESSIONAL ($149/mo):
  - 3 listings, boosted rank
  - Corridor targeting
  - Analytics dashboard
  CTA: "Outrank competitors in your corridor"

ELITE ($399/mo):
  - Unlimited, top placement, map pin, corridor sponsor
  CTA: "Dominate your corridors"

ENTERPRISE (custom):
  - API, white-label, data export, SLA
  CTA: "Talk to sales"
```

---

## Implementation Priority

| Page | CTA Change | Effort | Revenue Impact |
|---|---|---|---|
| `/tools/escort-calculator` | Post-result operator finder CTA | Low | High |
| `/directory` | Card CTAs + scarcity signals | Medium | High |
| `/` | Hero dual-CTA (buyer + operator) | Low | High |
| `/leaderboards` | Dual CTA + gamification prompt | Low | Medium |
| `/escort-requirements` | Cross-link calculator + find operators | Low | Medium |
| `/roles/pilot-car-operator` | Dual intent CTAs | Low | Medium |
