# Haul Command Ecosystem Icon Pack

> **Version:** 1.0 — Batch 1 (20 P0 icons)
> **System:** Premium industrial icon family for the heavy-haul logistics platform

## Quick Start

```tsx
import { HcIconPilotCarOperators, HcIconTruckStops } from '@/components/icons';

// Basic usage
<HcIconPilotCarOperators size={24} />

// With variant
<HcIconTruckStops size={20} variant="duotone" />

// With custom color
<HcIconPilotCarOperators size={18} className="text-hc-gold-500" />
```

## Design System

| Property | Value |
|----------|-------|
| ViewBox | `0 0 24 24` |
| Stroke Width | `1.75` |
| Line Caps | `round` |
| Line Joins | `round` |
| Default Color | `currentColor` |
| Sizing Targets | 14px, 16px, 18px, 20px, 24px, 32px |

## Variants

| Variant | Description |
|---------|-------------|
| `outline` | Default. Clean stroke-only icons |
| `filled` | Solid fill for active/selected states |
| `duotone` | Base strokes + subtle 12% fill accent |

## Batch 1 Icons (P0 — Core Market)

| # | ID | Label | Group |
|---|-----|-------|-------|
| 1 | `pilot_car_operators` | Pilot Car Operators | Core Market |
| 2 | `heavy_haul_trucking` | Heavy Haul Trucking | Core Market |
| 3 | `heavy_haul_brokers` | Heavy Haul Brokers | Core Market |
| 4 | `permit_services` | Permit Services | Core Market |
| 5 | `route_surveyors` | Route Surveyors | Core Market |
| 6 | `truck_parking` | Truck Parking | Core Market |
| 7 | `staging_yards` | Staging Yards | Core Market |
| 8 | `industrial_outdoor_storage` | Industrial Outdoor Storage | Core Market |
| 9 | `truck_repair_shops` | Truck Repair Shops | Core Market |
| 10 | `mobile_diesel_repair` | Mobile Diesel Repair | Core Market |
| 11 | `tow_recovery` | Tow & Recovery | Core Market |
| 12 | `trailer_leasing` | Trailer Leasing | Core Market |
| 13 | `truck_stops` | Truck Stops | Infrastructure |
| 14 | `hotels` | Hotels | Infrastructure |
| 15 | `warehouses` | Warehouses | Infrastructure |
| 16 | `cdl_schools` | CDL Schools | Support Services |
| 17 | `load_board` | Load Board | Platform Surfaces |
| 18 | `route_planner` | Route Planner | Platform Surfaces |
| 19 | `report_cards` | Report Cards | Platform Surfaces |
| 20 | `claims_verification` | Claims & Verification | Platform Surfaces |

## Registry API

```tsx
import { HC_ICON_REGISTRY, getHcIcon, getHcIconsByGroup } from '@/components/icons';

// Get a specific icon by ID
const pilotCar = getHcIcon('pilot_car_operators');
if (pilotCar) {
    const Icon = pilotCar.component;
    return <Icon size={20} />;
}

// Get all icons in a group
const coreMarket = getHcIconsByGroup('core_market');

// Full registry for dynamic rendering
HC_ICON_REGISTRY.forEach(icon => {
    console.log(icon.id, icon.label, icon.priority);
});
```

## File Naming

| Pattern | Example |
|---------|---------|
| Component | `HcIconPilotCarOperators.tsx` |
| SVG | `hc-icon-pilot_car_operators.svg` |
| Import | `import { HcIconPilotCarOperators } from '@/components/icons'` |

## Preview

Visit `/icons` in development to see the interactive preview grid with:
- Size selector (14px to 32px)
- Variant switcher (outline / filled / duotone)
- Dark / Light mode toggle
- Grouped categories
- Size comparison strip

## Upcoming Batches

- **Batch 2**: Pilot Car Companies, Crane & Rigging, Police Escorts, Secure Parking, Laydown Yards, Ports & Terminals, Rail & Intermodal, Trailer Repair, Tire Shops, Roadside Assistance, Property Hosts, Insurance, Financing, Permitting Authorities
- **Batch 3**: 38 additional icons covering full ecosystem (Self Storage, Truck Wash, Fuel, Rest Areas, Weigh Stations, Equipment Dealers, and all platform/status badge icons)
