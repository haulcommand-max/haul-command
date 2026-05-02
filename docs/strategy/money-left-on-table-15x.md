# Haul Command Money Left on the Table + 15X Improvements

_Last updated: 2026-05-01_

This file converts the mock/scaffold audit into revenue and product expansion priorities.

## Immediate money left on the table

### 1. Rateable escort positions are not fully monetized

Missing or under-modeled positions like steerman, fifth car, high pole, drone route survey, bucket truck, wire lift, traffic control, and police coordination should not be buried inside generic pilot-car pricing.

**Money path:** every posted load should generate a role requirement stack and a rate stack.

- Base escort rate
- Lead car rate
- Rear/chase car rate
- High pole premium
- Steer/tillerman premium
- Fifth car / extra escort premium
- Route survey fee
- Drone route survey fee
- Bucket truck / wire-lift coordination fee
- Police escort coordination fee
- Night/weekend/holiday premium
- Deadhead, layover, detention, cancellation, rush fees

### 2. Glossary traffic is not yet fully tied to commerce

Every glossary term should route to commercial actions.

Examples:

- `steerman` -> find steer/tillerman providers, post a load requiring steer support, claim steer capability, sponsor steer/tillerman pages.
- `fifth car` -> explain permit triggers, quote extra escort, sponsor extra escort pages.
- `drone route survey` -> quote survey, sell partner package, upsell route intelligence report.
- `bucket truck escort` -> route to utility clearance providers.

### 3. AdGrid has sponsor concepts but mock data

The mobile AdGrid and sponsor cards are still mock-only. Territory sponsorship needs to become sellable inventory.

**Money path:** country -> state/province -> city -> corridor -> glossary term -> service category -> profile page sponsorship.

### 4. Corridor pages have fake supply/demand

Corridors should become paid intelligence and lead-gen pages.

**Money path:** sell corridor sponsor slots, corridor data reports, route survey packages, preferred provider placement, and claim prompts for supply-starved corridors.

### 5. Route survey can be a premium product line

Route survey is not one thing. Split it into:

- Basic route survey
- Written route survey report
- High-pole route validation
- Drone route survey
- LiDAR / 3D / digital twin survey
- Bridge/utility conflict review
- Port/site access review
- Wind blade / transformer / crane route survey

### 6. Marketplace equipment is dormant

BuildASign-style fulfillment is not wired, but the need is real.

**Money path:** authorized supplier/drop-ship marketplace for banners, flags, beacons, radios, height poles, reflective tape, PPE, dashcams, GPS trackers, and install referrals.

### 7. Supabase vector/RAG replacement is not complete

Old Pinecone code remains. Supabase should power semantic role/alias matching, glossary retrieval, profile matching, and quote intent classification.

**Money path:** better matching -> more claims, more quotes, more broker confidence, more paid data products.

### 8. Country-local equivalents are not complete enough

Terms like Batedor, BF3/BF4, Voiture Pilote, Scorta Tecnica, Load Pilot, OSOM, abnormal load, ODC, and convoi exceptionnel are started, but not enough for all 120 countries.

**Money path:** country-local SEO + trust + claim conversion.

## 15X improvements

### 1. Requirement Stack Engine

Build a requirement engine that takes a load and outputs:

- Required permits
- Required escort positions
- Optional but recommended positions
- Rate categories
- Hazard modifiers
- route survey need
- utility/police/traffic-control need
- glossary explanations
- provider matching filters

This turns a load post into a monetizable checklist.

### 2. Role-to-Revenue Matrix

Every role/capability gets:

- glossary page
- profile badge
- claim prompt
- load-board filter
- quote input
- pricing category
- sponsor inventory
- training module
- country aliases
- internal links

### 3. Commercial Glossary Pages

Glossary pages should not be informational dead ends. Each should include:

- definition
- field usage
- when it is required
- what it costs
- related hazards
- related permits
- related tools
- find providers
- post a load
- claim capability
- sponsor this term
- country equivalents

### 4. Corridor Intelligence Products

Create public/free and paid/private layers:

Free:
- overview
- common hazards
- required escorts
- glossary links
- provider cards

Paid:
- demand history
- rate ranges
- supply gaps
- route survey warnings
- sponsor heatmaps
- operator availability trends

### 5. Fixture-to-Live Enforcement

Every mock UI should have a fixture mode and a live mode.

- dev/demo pages can use fixtures
- production pages must use Supabase/API
- CI should fail when `MOCK_` arrays appear in production files

### 6. Claim Machine Upgrade

When a term/profile/capability is missing, create a claim or partner prompt.

Examples:

- Search for `steerman near me` with no results -> recruit/claim steer-capable operators.
- Search for `drone route survey` with no results -> partner application for drone surveyors.
- Corridor has load demand but no high-pole supply -> outreach to high-pole operators.

### 7. Data Monetization Layer

Repeated observations should be preserved, not deleted.

Monetizable datasets:

- corridor demand
- rate observations
- role requirement frequency
- fifth-car requirement frequency
- high-pole requirement frequency
- police escort requirement frequency
- route survey triggers
- country/local terminology usage
- claim conversion by role/category

### 8. Country-Local Expansion Guardrail

Every new role term needs:

- canonical English label
- local country aliases
- legal/regulatory notes where known
- local profile/service category
- local search keywords
- local sponsor surface
- local glossary page

### 9. No Dead-End Rule

No page should end with only information.

Every page must offer at least one of:

- find provider
- post load
- request quote
- claim listing
- add capability
- sponsor territory
- apply as partner
- buy equipment
- view training
- download data/report

### 10. Money-path scoring

Every feature should get a score from 0-100 across:

- claim conversion
- quote conversion
- sponsor revenue
- data monetization
- SEO/AEO traffic
- marketplace revenue
- trust/review value
- global localization value

Anything below 60 gets parked unless it supports compliance or trust.
