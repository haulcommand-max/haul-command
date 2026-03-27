# Haul Command — Data Architecture Reference
# This distinguishes OPERATORS (people/services) from PLACES (locations)

## Canonical Tables

### `directory_listings` (VIEW over a base table)
- **What it is:** The canonical registry of all service OPERATORS
- **Who belongs here:** Pilot car operators, escort companies, freight brokers,
  flaggers, permit services, WITPAC operators, heavy towing, mobile mechanics
- **entity_type values:** `operator`, `pilot_car_operator`, `pilot_driver`,
  `freight_broker`, `flagger`, `permit_service`, `heavy_towing`, `mobile_mechanic`
- **Read by:** `/api/directory/listings` → mobile app ticker, directory pages
- **Current count:** ~82,000 operators (72K generic operators + 5.8K pilot cars + 1.8K drivers)

### `hc_places`
- **What it is:** Physical LOCATION registry (geographic infrastructure)
- **Who belongs here:** Ports, truck stops, hotels, motels, weigh stations, 
  terminals, intermodal yards, crane yards, oil/gas facilities
- **entity_type values:** `port`, `truck_stop`, `hotel`, `terminal`, `rail_intermodal`,
  `oil_gas_facility`, `crane_service`, `heavy_equipment_dealer`
- **Current count:** 1,397 legitimate places
- **DO NOT insert operators here**

### `hc_entity` (~27K rows)
- Geographic/entity nodes for the knowledge graph

### `operators` (55 rows)
- Thin premium operator table (claimed/verified users only)

### `providers` (formerly abused for matrix data — cleaned)
- Internal scoring/enrichment table

## Activity Ticker Architecture
The "X operators now listed globally" badge on mobile:
1. Runs via cron: `GET /api/cron/activity-refresh` (every 15 min)
2. Queries `directory_listings WHERE is_visible=true AND entity_type IN (...operators...)`
3. Inserts result into `activity_events` table
4. Mobile fetches latest `activity_events` and displays with timestamp

## Rules for Future Ingestion
- Operator/person/service → INSERT into `directory_listings` base table
- Physical location → INSERT into `hc_places`
- NEVER mix the two
