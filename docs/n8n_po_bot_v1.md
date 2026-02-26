# n8n PO Bot v1 — Dropship Automation Flow (Supabase Edition)
## GHL Order → Supabase → Vendor PO → Tracking → Customer Notify

---

## Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    n8n PO BOT v1 (Supabase)                  │
│                                                              │
│  ┌──────────────┐                                            │
│  │ GHL Webhook   │  ◄── Order.created event                  │
│  │ (Trigger)     │                                           │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Parse Order   │  Extract: line items, shipping address,   │
│  │               │  rush flag, bundle flag, Priority Lane    │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Supabase:     │  INSERT into "store_orders"               │
│  │ Log Order     │  INSERT into "store_line_items"           │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │        VENDOR ROUTER (Switch)        │                    │
│  │                                      │                    │
│  │  Collection match → Vendor:          │                    │
│  │  Signs/Flags/Banners → Safety Flag   │                    │
│  │  Beacons/Strobes     → ECCO          │                    │
│  │  Apparel/PPE         → TASCO         │                    │
│  │  High-Pole/Rattler   → AMC           │                    │
│  │  Rigging/Hardware    → US Cargo Ctrl │                    │
│  │  Decals/Branded      → BuildASign    │                    │
│  │  Digital/Training    → GHL (instant) │                    │
│  └──────┬───────────────────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │     PO BUILDER (per vendor)          │                    │
│  │                                      │                    │
│  │  1. Generate PO PDF:                 │                    │
│  │     - HC PO number (HC-PO-YYYYMMDD-N)│                   │
│  │     - Vendor info                    │                    │
│  │     - Line items + qty + price       │                    │
│  │     - Ship-to address (customer)     │                    │
│  │     - Rush flag if applicable        │                    │
│  │                                      │                    │
│  │  2. Generate blind-ship packing slip:│                    │
│  │     - HC branding (logo + tagline)   │                    │
│  │     - NO vendor info visible         │                    │
│  │     - Order # + items + ship-to      │                    │
│  │     - "Questions? text HELP to XXX"  │                    │
│  │                                      │                    │
│  │  3. Generate CSV attachment:         │                    │
│  │     - SKU, Name, Qty, Ship-To        │                    │
│  └──────┬───────────────────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │     EMAIL TO VENDOR                  │                    │
│  │                                      │                    │
│  │  To: orders@[vendor].com             │                    │
│  │  CC: audit@haulcommand.com           │                    │
│  │  Subject: HC PO #{number} - {items}  │                    │
│  │  Body: PO details + blind-ship note  │                    │
│  │  Attach: PO.pdf + items.csv          │                    │
│  │  Attach: packing_slip.pdf            │                    │
│  └──────┬───────────────────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │     TRACKING LISTENER                │                    │
│  │                                      │                    │
│  │  Option A: Vendor API (if available) │                    │
│  │    - Poll every 2 hours              │                    │
│  │    - Match PO # → extract tracking   │                    │
│  │                                      │                    │
│  │  Option B: Email Parser              │                    │
│  │    - Watch audit@haulcommand.com     │                    │
│  │    - Parse vendor reply for:         │                    │
│  │      tracking #, carrier, ETA        │                    │
│  │    - Regex: /\b1Z[A-Z0-9]{16}\b/    │  (UPS)             │
│  │    - Regex: /\b\d{12,22}\b/          │  (FedEx)           │
│  │    - Regex: /\b\d{20,22}\b/          │  (USPS)            │
│  │                                      │                    │
│  │  Option C: Manual (SMS fallback)     │                    │
│  │    - If no tracking in 48hrs:        │                    │
│  │      alert admin + email vendor      │                    │
│  └──────┬───────────────────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │     WRITE BACK                       │                    │
│  │                                      │                    │
│  │  → Supabase: tracking #, carrier,    │                    │
│  │    ship date, status = 'shipped'     │                    │
│  │  → GHL Contact: update custom fields │                    │
│  │  → GHL Pipeline: move to "Tracking"  │                    │
│  └──────┬───────────────────────────────┘                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                    │
│  │     NOTIFY CUSTOMER                  │                    │
│  │                                      │                    │
│  │  SMS: "🏷️ Tracking: {link}"         │                    │
│  │  Email: Full status + spec tips      │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                    │
│  │     NIGHTLY RECONCILIATION           │                    │
│  │     (Cron: 11:59 PM CST)             │                    │
│  │                                      │                    │
│  │  → RPC: calculate_daily_profit()     │                    │
│  │  → Write to "store_profit_daily"     │                    │
│  │  → Alert if any PO missing tracking  │                    │
│  └──────────────────────────────────────┘                    │
│ └─────────────────────────────────────────────────────────────┘
```

---

## Supabase Schema

### Table: store_orders

```sql
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL, -- HC-ORD-YYYYMMDD-NNNN
    ghl_contact_id TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    shipping_state TEXT,
    order_total NUMERIC(10,2),
    rush_flag BOOLEAN DEFAULT FALSE,
    rush_surcharge NUMERIC(10,2) DEFAULT 0.00,
    bundle_type TEXT, -- Starter / Pro / Rattler / None
    priority_lane BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'new', -- new, paid, po_sent, shipped, delivered, review
    spec_risk TEXT DEFAULT 'LOW', -- LOW, MEDIUM, HIGH
    jurisdiction_hint TEXT,
    profit_margin NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: store_line_items

```sql
CREATE TABLE IF NOT EXISTS public.store_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.store_orders(order_id),
    sku TEXT NOT NULL,
    product_name TEXT,
    collection TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2),
    wholesale_cost NUMERIC(10,2),
    margin NUMERIC(10,2) GENERATED ALWAYS AS (unit_price - wholesale_cost) STORED,
    vendor TEXT, -- Safety Flag / ECCO / TASCO / AMC / US Cargo / BuildASign / Digital
    po_number TEXT, -- HC-PO-YYYYMMDD-N
    tracking_number TEXT,
    carrier TEXT, -- UPS / FedEx / USPS / Other
    ship_date DATE,
    eta DATE,
    status TEXT DEFAULT 'pending', -- pending, po_sent, shipped, delivered
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: store_vendors

```sql
CREATE TABLE IF NOT EXISTS public.store_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT UNIQUE NOT NULL,
    vendor_email TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    blind_ship BOOLEAN DEFAULT FALSE,
    min_order NUMERIC(10,2) DEFAULT 0.00,
    daily_cutoff TEXT, -- 2 PM CST
    avg_ship_time INTEGER, -- days
    returns_address TEXT,
    status TEXT DEFAULT 'applied', -- applied, approved, active, paused
    collections TEXT[], -- Array of collections served
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: store_profit_daily

```sql
CREATE TABLE IF NOT EXISTS public.store_profit_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE DEFAULT CURRENT_DATE,
    total_revenue NUMERIC(10,2) DEFAULT 0.00,
    total_cogs NUMERIC(10,2) DEFAULT 0.00,
    rush_revenue NUMERIC(10,2) DEFAULT 0.00,
    subscription_revenue NUMERIC(10,2) DEFAULT 0.00,
    gross_margin NUMERIC(10,2) GENERATED ALWAYS AS (total_revenue - total_cogs) STORED,
    margin_pct NUMERIC(5,2),
    orders_count INTEGER DEFAULT 0,
    avg_aov NUMERIC(10,2),
    pending_tracking INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ECCO Minimum Order Logic (n8n)

ECCO requires $135 minimum. The n8n flow uses Supabase for batching:

```javascript
// n8n Function Node: ECCO Batch Check
const vendor = "ECCO";
const items = $node["Parse Order"].json.items.filter(i => i.vendor === vendor);
const orderTotal = items.reduce((sum, i) => sum + (i.wholesale_cost * i.quantity), 0);

if (orderTotal < 135) {
    // 1. Query Supabase for OTHER pending ECCO items from last 24h
    // 2. IF SUM < 135: Hold production, set status to 'pending_batch'
    // 3. IF SUM >= 135: Combine all pending items into ONE PO, fire order.
}
```

---

## Rush Surcharge & Priority Lane

- **Stored in `store_orders`**
- **Trigger:** GHL `tag_added` or `order_created`
- **Logic:** n8n fetches `priority_lane` status from Supabase before calculating total in `store_orders`.

---

## Brand Integrity: Haul Command (H-A-U-L)

All documents and code must use **Haul Command**.
- `Hall Command` is a misspelling.
- `Haukman` is a misinterpretation of audio.
- **Haul Command** is the definitive brand.
