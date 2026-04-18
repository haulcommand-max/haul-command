# Mapbox Architecture & Pricing Optimization Strategy
**Project:** Haul Command
**Object:** Establish absolute maximum data yield with "Double Platinum" low-friction unit economics based on Mapbox 2026 pricing.

After analyzing Mapbox's current routing, geocoding, and map load pricing models for enterprise logistics applications, we have aligned the Haul Command configuration to avoid variable-cost hyperscaling. The core logic exploits **Monthly Active User (MAU)** vs **Metered Event** pricing structures.

## 1. Mapbox GL JS Seats vs. Per-Load Web Maps
### The Feature:
Broker dashboards and dispatch map surfaces are constantly refreshed, running long sessions, and actively tracking Live Marketplace vehicles. 
### The Problem:
*Mapbox GL JS Map Loads* charges per map initialization. If a broker reloads the marketplace or switches views 100 times a day, this generates extreme, unpredictable variable spend.
### Haul Command Configuration:
**Mapbox GL JS Seats (MAU Pricing).** We structure our enterprise key so that Brokers and logged-in Dispatchers are configured under Seat-based pricing. We pay a flat fee per MAU rather than per Map Load. This bounds our costs linearly with revenue-generating users, not page loads. 

## 2. Navigation SDK: Unlimited Trips vs Metered
### The Feature:
Pilot car operators and heavy haul drivers need live routing, map matching, and territory alerts running constantly during active escort operations. 
### The Problem:
*Metered Trips* pricing charges per active guidance trip. High-volume operators taking multiple localized runs a day will balloon costs. 
### Haul Command Configuration:
**Navigation SDK Unlimited Trips (MAU Tier).** Since escorts rely on Haul Command continuously, moving the Mobile SDK to the Unlimited Trips profile allows operators to accept limitless route surveys, directions, and Live Matching calls without escalating operational taxes.

## 3. Search Box API (Address Autofill) vs Permanent Geocoding
### The Feature:
When a broker inputs a new load origin and destination, we must resolve geographical coordinates (Lat/Lng) to pass into the Mapbox Matrix arrays and Supabase radius functions (PostGIS).
### The Problem:
Single lookup `Geocoding API (Temporary)` responses cannot be stored legally in database structures long-term. `Permanent Geocoding` costs significantly more per request. If we use autocomplete, firing searches on every keystroke racks up high query volume.
### Haul Command Configuration:
**Search Box API (Sessions).** We utilize Session-based billing. A single UI session gives a user 50 keystroke "suggest" queries and 1 "retrieve" query for a flat fractional cost. We tie the retrieve to a Permanent license so we legally cache the exact PostGIS corridor anchors in our Supabase schema.

## 4. Map Matching & Matrix API Arrays (The "Live Match" Engine)
### The Feature:
Haul Command's stage-probability and territory intelligence require measuring ETA from available escorts to a pinned load origin.
### Haul Command Configuration:
**Matrix Application Profile.** We batch Matrix API calls from the server edge (Supabase Edge DB) rather than individual mobile SDK requests. This allows us to calculate travel times for up to 25 escorts simultaneously against 1 load origin in a single, perfectly optimized API hit.

## 5. Tileset Processing & Hosting
### The Feature:
Custom Haul Command mapping layers (e.g. state-specific bridge restriction overlays, compliance zones).
### Haul Command Configuration: 
**Mapbox Tiling Service (MTS).** We process restriction geometries once directly on Mapbox servers, resulting in pure vector delivery. Instead of querying Supabase for massive GeoJSON arrays on every screen refresh, we compile restriction corridors into Mapbox natively via MTS, saving server bandwidth and delivering zero-latency rendering.
