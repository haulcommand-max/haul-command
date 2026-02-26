# HAUL COMMAND — ANTI-GRAVITY EXECUTE SPEC (LEAN → ELITE)

## OBJECTIVE
Build a production-ready marketplace + intelligence platform for oversize/pilot-car operations that:
• cleans location data
• matches loads to escorts intelligently
• proves route compliance
• powers a transparent leaderboard
• enables usage + subscription monetization
• looks and behaves like a corporate-grade platform

## PRINCIPLES
• thin Google dependency (optional)
• open-source first
• provider-agnostic billing
• evidence-driven trust scoring
• scale without re-architecture

────────────────────────────────
## STACK (INSTALL IN THIS ORDER)
────────────────────────────────

### CORE DATA LAYER
1. **PostgreSQL + PostGIS**
   ROLE: primary relational + spatial database
   USE: loads, escorts, lanes, proximity, corridor scoring

2. **Redis**
   ROLE: cache + queues + rate limiting
   USE: search caching, session speed, job queues

### SEARCH & DISCOVERY
3. **typesense/typesense**
ROLE: instant marketplace search
INDEXES:
* directory_index
* load_index
* lane_index
MUST SUPPORT: typo tolerance, geo filtering, faceting

### GEO NORMALIZATION
4. **osm-search/Nominatim**
ROLE: bulk geocoding + reverse geocoding
OUTPUT: canonical lat/lon + normalized address

### ROUTING BRAIN (ROUTER-OF-ROUTERS)
5. **graphhopper/graphhopper**
ROLE: primary routing engine

6. **Project-OSRM/osrm-backend**
   ROLE: high-volume matrix + ETA speed layer

7. **valhalla/valhalla**
   ROLE: map matching + evidence reconstruction

**RULE:**
• OSRM = bulk matrix
• GraphHopper = default routing
• Valhalla = breadcrumb truth

### MAP EXPERIENCE
8. **maplibre/maplibre-gl-js**
ROLE: frontend interactive maps

9. **maptiler/tileserver-gl**
   ROLE: self-hosted map tiles + styling

### DISPATCH OPTIMIZATION
10. **VROOM-Project/vroom**
ROLE: escort assignment + multi-vehicle optimization
OUTPUT: recommended escort set per load

### GEO INTELLIGENCE (UNFAIR ADVANTAGE)
11. **uber/h3**
ROLE: hex indexing across US/Canada
USE:
- coverage heatmaps
- demand zones
- corridor confidence

### AUTH & ENTERPRISE FEEL
12. **keycloak/keycloak**
ROLE: SSO + RBAC
ROLES: escort, broker, admin, partner

### ANALYTICS & LEADERBOARD
13. **apache/superset**
ROLE: transparency dashboards
PUBLIC PANELS:
- top escorts by region
- on-time score
- lane reliability

### OBSERVABILITY (CORPORATE CREDIBILITY)
14. **open-telemetry/opentelemetry-collector**
15. **prometheus/prometheus**
16. **grafana/grafana**

### BILLING & MONETIZATION
17. **getlago/lago**
ROLE: billing brain (subscriptions + usage)

### PAYMENTS
18. **Stripe Payments (external integration)**
ROLE: card/ACH processing only
NOTE: Lago generates invoices → Stripe collects

### OPTIONAL (ENABLE WHEN TRAFFIC WARRANTS)
19. **ClickHouse**
ROLE: high-volume event analytics
USE: marketplace intelligence + funnel analytics

────────────────────────────────
## PRODUCT MODULES TO GENERATE
────────────────────────────────

### MODULE A — DIRECTORY
• escort companies
• permit providers
• support vendors
**FEATURES**
• geo search via Typesense
• verification status
• coverage areas (H3 indexed)
• response metrics

### MODULE B — LOAD BOARD
• post loads
• smart escort matching (VROOM)
• route preview
• ETA matrix (OSRM)
• notifications

### MODULE C — LEADERBOARD & TRUST
**Trust Score inputs:**
• on-time performance
• route adherence (Valhalla map match)
• broker feedback
• job volume
• incident flags

**OUTPUT**
• public leaderboard
• regional rankings
• corridor reliability

### MODULE D — BILLING & REVENUE
Implement via Lago:
**Plans**
• free
• verified listing
• broker pro
• enterprise

**Usage meters**
• lead unlock
• dispatch assist
• API calls
• premium lane intel

Stripe handles payment collection.

────────────────────────────────
## UNFAIR ADVANTAGE ENGINE (MANDATORY)
────────────────────────────────

### CORRIDOR CONFIDENCE PIPELINE

**STEP 1 — INGEST**
• loads
• GPS breadcrumbs
• escort reports
• broker ratings

**STEP 2 — NORMALIZE**
• Nominatim → canonical location
• H3 index assignment

**STEP 3 — ROUTE + MATCH**
• GraphHopper baseline
• OSRM matrix
• VROOM escort optimization

**STEP 4 — EVIDENCE**
• Valhalla map matching
• compare planned vs actual

**STEP 5 — SCORE**
Compute per-corridor metrics:
• delay frequency
• escort success rate
• incident density
• average speed variance

**STEP 6 — SURFACE**
Expose via:
• search ranking boost
• leaderboard weight
• premium lane intelligence

This becomes the core moat.

────────────────────────────────
## PERCEIVED-VALUE MULTIPLIERS (HIGH ROI)
────────────────────────────────

**ENABLE EARLY**
• branded MapLibre map
• public performance dashboards
• verified badges
• response time metrics
• coverage heatmaps

**ENABLE AT SCALE**
• ClickHouse event intelligence
• dynamic demand zones (H3)
• predictive escort matching

────────────────────────────────
## ANTI-GRAVITY BUILD RULES
────────────────────────────────

• containerize every service
• enforce health checks
• centralize environment variables
• implement request deduping for routing
• cache matrix results in Redis
• log every billing event to Lago
• expose internal services via gateway layer
• design for US + Canada coverage from day one

────────────────────────────────
## SUCCESS CRITERIA
────────────────────────────────

**MVP SUCCESS**
✓ sub-second search
✓ clean geo normalization
✓ automated escort matching
✓ public trust leaderboard
✓ working subscription + usage billing

**DOMINANCE SIGNALS**
✓ corridor confidence heatmap
✓ proof-based rankings
✓ smart dispatch recommendations
✓ enterprise-grade dashboards

END OF SPEC
