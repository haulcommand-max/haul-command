# BLAST Framework: Master Execution Plan

> Blueprint. Link. Architect. Style. Trigger.
> Haul Command is a Deterministic Operating System, not a service shop.

---

## Tech Stack Decisions (Locked)

| Layer | Technology | Purpose |
|---|---|---|
| **Source of Truth** | Supabase (Postgres) | Vehicles, permits, carriers, compliance, quotes |
| **Long-Term Memory** | Pinecone | Data exhaust: enforcement patterns, clearance history, risk intelligence |
| **Unified Portal** | GoHighLevel (GHL) | Sub-accounts, CRM, forms, instant quoting, dispatch coordination |
| **UI/Design** | Google Stitch | Carrier dashboard, shipper portal, reputation index |
| **3D Route Intelligence** | HERE Technologies API | Bridge clearance, route geometry, 3D risk prediction |
| **Regulatory Intelligence** | NotebookLM Super-Research Agent | State manuals ingestion, curfew rules, signage specs |
| **Voice Dispatch** | Vapi / Retell AI | Automated phone dispatch for escorts and carriers |
| **Payment Rail** | Haul Pay (Proprietary) | EWA, factoring (3-5%), internal money movement |
| **Browser Automation** | Anti-Gravity Agent | Government portal automation, permit submission |

---

## PHASE 1: The Fastest Permit Engine (Months 0-6)

### 1A. Supabase: Source of Truth (THE FOUNDATION)
Deploy the Data Moat schema (see `data_moat_schema.sql`):
- `carriers` — Verified identities, TWIC/WITPAC, insurance, authority
- `vehicles` — Dimensions, axle configs, weight, equipment type
- `permits` — Every permit issued, state, type, cost, timeline
- `routes` — Scored routes with segment clearance data
- `quotes` — Every instant quote generated (revenue tracking)
- `compliance_alerts` — Renewal warnings, violations, expirations
- `enforcement_data` — DOT patterns, ticket traps, inspection rates (Pinecone mirror)

### 1B. NotebookLM: Regulatory Brain
- Ingest FL Participant Workbook + state manuals for all 50 states
- Extract: curfew hours, night escort rules, signage specs, axle spacing requirements
- Output: Zero-Error Compliance Check API consumed by the Feasibility Engine

### 1C. HERE API: 3D Clearance Prediction
- Connect to HERE Truck Routing API for real bridge/tunnel/overpass clearance data
- Overlay with our Predictive Routing Core for "nightmare loads" (radomes, tunnel-boring machines)
- Store every clearance result → feeds the Data Moat

### 1D. Anti-Gravity Browser Agent
- Programmatically navigate government permit portals
- Auto-fill from Supabase vehicle profiles
- Transform weeks-long manual process → minutes-long automated execution
- This is how we kill the fax/email workflows

---

## PHASE 2: The Operating System (Months 6-18)

### 2A. GoHighLevel: Unicorn Portal
- GHL sub-accounts per carrier/fleet
- Unified dashboard: permits + dispatch + escorts + compliance
- GHL Forms → Instant Quoting Engine integration
- Automated follow-ups, renewal reminders, compliance calendars

### 2B. Haul Pay: Proprietary Payment Rail
- Replace Stripe with owned payment infrastructure
- Earned Wage Access (EWA) for drivers
- 3-5% factoring margins on invoiced loads
- Fuel advances with compound interest rails

### 2C. Lock-In Architecture
Once inside the "atmosphere," carriers have:
- Verified Identity (TWIC/WITPAC) stored
- Financial flow running through Haul Pay
- Gear inventory tracked
- Permit history + compliance records
- **Switching cost = enormous**

---

## PHASE 3: The Data Moat (Months 18-36)

### 3A. Pinecone: Long-Term Memory
- Every permit, route, clearance check, enforcement encounter → vectorized and stored
- AI agents track DOT enforcement patterns + "ticket traps"
- Bridge strike risk memory → increasingly accurate 3D route assessments

### 3B. Monetization
- **Risk Intelligence Reports**: $5,000-$50,000 per report sold to insurance carriers
- **Compliance Scoring API**: Fleets pay for real-time compliance grades
- **Clearance Intelligence**: Routing companies pay for bridge/tunnel clearance data

---

## PHASE 4: Marketplace Control (Months 36-60)

### 4A. Verified Reputation Index
- Every carrier, escort, surveyor rated and ranked
- Performance history = verifiable trust score
- Shippers use our index for carrier selection

### 4B. The Kill Shot: Predictive Permitting
- Permit feasibility BEFORE freight acceptance
- Shippers avoid "no-go" routes and million-dollar liabilities
- Haul Command becomes part of FREIGHT DECISIONING

### 4C. Bundling Margin Stack
Single transaction: permits + pilot cars + route surveys + equipment + insurance
Every additional service in the bundle increases margin and switching cost.

---

## Competitive Outcome

| Metric | Legacy Agencies | Haul Command |
|---|---|---|
| Permit Ordering | Email/fax/phone | Automated in minutes |
| Vehicle Data | Re-entered every time | Auto-filled from profiles |
| Route Intelligence | Manual surveys | AI 3D clearance prediction |
| Payment | Invoices, net-30 | Haul Pay (instant, 3-5% factoring) |
| Data Reuse | None | Every transaction feeds the moat |
| Switching Cost | Low | Enormous (identity + money + data) |
| Predictive Capability | None | Feasibility before freight acceptance |

> Legacy agencies relying on human "experience" cannot survive this.
> This is infrastructure vs. service. Infrastructure always wins.
