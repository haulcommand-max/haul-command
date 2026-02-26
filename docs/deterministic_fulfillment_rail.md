# Deterministic Fulfillment Rail — Autonomous Order Processing

> From manual dropship → browser-automated fulfillment → true warehouse sovereignty.
> The machine processes orders while your laptop is closed.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  FULFILLMENT RAIL                           │
│                                                             │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ SUPABASE  │───▶│  MODAL       │───▶│ SUPPLIER     │      │
│  │ Order DB  │    │ Cloud Engine │    │ PORTAL       │      │
│  │           │    │              │    │ (BuildASign, │      │
│  │ • order   │    │ • Detects    │    │  Amazon,     │      │
│  │   created │    │   new orders │    │  Direct)     │      │
│  │ • payment │    │ • Spins up   │    │              │      │
│  │   cleared │    │   browser    │    │ • Places     │      │
│  │ • status  │    │ • Fills form │    │   order      │      │
│  │   tracked │    │ • Confirms   │    │ • Ships to   │      │
│  └───────────┘    └──────────────┘    │   customer   │      │
│       ▲                │              └──────────────┘      │
│       │                ▼                                    │
│  ┌────┴──────────────────────┐                              │
│  │     POST-FULFILLMENT      │                              │
│  │                           │                              │
│  │ • Tracking # → Supabase   │                              │
│  │ • SMS/Email confirmation  │                              │
│  │ • Remotion "Thank You"    │                              │
│  │   video auto-generated    │                              │
│  │ • Haul Pay deduction      │                              │
│  └───────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Automated Dropship (NOW)

### Trigger Flow
1. Customer purchases from Haul Command Store (GHL or web)
2. Supabase row created in `store_orders` table with status `pending_fulfillment`
3. Modal function detects new order (polling every 60 seconds)
4. Anti-Gravity browser agent navigates to supplier portal
5. Agent fills in: item SKU, quantity, shipping address, payment
6. Agent confirms order, captures supplier order # and tracking
7. Supabase row updated: `status = fulfilled`, `tracking_number = xxx`
8. GHL sends SMS/email with tracking to customer
9. Remotion generates branded "Thank You" video (optional)

### Supplier Routing Table

| Category | Primary Supplier | Fulfillment Method | Branding |
|---|---|---|---|
| Signage (Oversize Load, banners) | BuildASign | White-label, "No Branding" ship option | Unbranded (Uber-style) |
| Safety Vests, Flags, Triangles | Amazon Business | Direct ship | Amazon packaging |
| High Pole Systems, Extensions | Rattler Direct / Amazon | Direct ship | Manufacturer packaging |
| Radios (Baofeng, UHF/VHF) | Amazon / Baofeng Direct | Direct ship | Manufacturer packaging |
| Lightbars, Sirens | Amazon / LED specialty | Direct ship | Manufacturer packaging |
| Brake Chambers, Hub Wheels | FleetPride / Amazon | Direct ship | Manufacturer packaging |
| Emergency Kits | Amazon / Orion | Direct ship | Manufacturer packaging |

### BuildASign White-Label Integration
- Use "No Branding" shipping option for all signage
- Haul Command branding on product, not on box
- Browser agent navigates BuildASign portal → uploads design → enters ship-to → confirms

---

## Phase 2: Inventory Intelligence (NEXT)

### Stock Level Monitoring
- Modal-deployed Firecrawl agent scrapes supplier stock levels every 6 hours
- Results stored in `supplier_inventory` Supabase table
- If stock < threshold → auto-flag item as "Low Stock" or "Sold Out" in store
- Members get priority backorder alerts via GHL inbox

### Price Monitoring
- Agent scrapes competitor pricing on Amazon, FleetPride
- Ensures Haul Command member prices stay < market
- Ensures non-member punitive prices stay > market
- Supabase `product_pricing` table tracks price history

---

## Phase 3: True Warehouse Sovereignty (FUTURE)

### When to Transition
- Revenue > $50K/month from store
- Top 10 SKUs identified by volume
- Warehouse economics justify bulk purchasing

### Warehouse System
- Supabase tracks physical inventory across warehouse locations
- Vapi "Dispatch" agent provides tracking/shipping status via phone
- Haul Pay processes all payments through proprietary rail
- Remotion generates packing slip + branded insert for every box

---

## Compliance Refresh Subscription ("Rogue Garbage" Killer)

### The Problem
Gear degrades: vests get grimy, flags fray, magnets crack, LED bulbs burn out.
Non-compliant gear = DOT tickets = $500+ fines per incident.

### The Solution: Automated Half-Life Tracking

| Item | Half-Life | Refresh Trigger | Refresh Kit Contents |
|---|---|---|---|
| Safety Vest (Class 2/3) | 6 months / 50 loads | Navixy load count OR calendar | Fresh vest + 3M tape strips |
| Warning Flags (18x18) | 3 months / 30 loads | Navixy load count OR calendar | 4-pack replacement flags |
| Oversize Load Magnets | 12 months | Calendar | Fresh magnetic signs (2x) |
| LED Bulbs (194 Base) | 6 months | Calendar + Navixy night-move count | 10-pack LED replacement |
| Tarp Straps (UV resistant) | 4 months | Calendar + UV exposure estimate | 12-pack replacement straps |

### Automation Flow
1. Navixy tracks load count + miles per operator
2. When operator crosses half-life threshold → Supabase triggers event
3. GHL sends notification: "Your compliance refresh kit is shipping"
4. Haul Pay auto-deducts from next payout (or charges card)
5. Modal browser agent places order at BuildASign/Amazon
6. Fresh kit ships → operator stays DOT compliant → zero tickets

### Revenue Model
- Subscription: $29/month (auto-ships when triggered)
- One-time: $49 per kit (on-demand)
- Enterprise fleet: $19/month per vehicle (volume discount)

---

## Supabase Schema Extension

```sql
-- Store Orders Table
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID REFERENCES public.carriers(id),
    order_number TEXT UNIQUE NOT NULL,
    items JSONB NOT NULL, -- [{sku, name, qty, unit_price, supplier}]
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    pricing_tier TEXT NOT NULL CHECK (pricing_tier IN ('member', 'non_member')),
    payment_method TEXT, -- 'hall_pay', 'card', 'ewa_deduction'
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN (
        'pending', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled'
    )),
    supplier_order_ids JSONB, -- [{supplier, order_id, tracking}]
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Refresh Subscriptions
CREATE TABLE IF NOT EXISTS public.compliance_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID REFERENCES public.carriers(id),
    vehicle_id UUID REFERENCES public.vehicle_profiles(id),
    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'one_time', 'enterprise')),
    monthly_rate DECIMAL(8,2),
    items_tracked JSONB NOT NULL, -- [{item_sku, half_life_loads, half_life_days, last_refreshed}]
    next_refresh_date DATE,
    loads_since_refresh INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Inventory Cache
CREATE TABLE IF NOT EXISTS public.supplier_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier TEXT NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    supplier_price DECIMAL(10,2),
    last_scraped TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier, sku)
);
```
