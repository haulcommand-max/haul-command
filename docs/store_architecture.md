# Haul Command Store Architecture
## 608 SKUs · 5 Vendors · Zero Humans in the Loop

---

## The Diagnosis

**Persona:** Driver + Broker, US-first.

**Pain:** Nobody sells "pilot-car kits" cleanly. Buyers must:
1. Guess state-by-state specs (signage, flags, lights all vary)
2. Chase stock and tracking from random shops
3. Eat wrong-gear returns when specs don't match jurisdiction
4. Burn margin on manual quotes and email tag

**Jurisdiction Twist:** Signage/flag/light specs vary by **state and even city**. Every product needs clear spec notes to avoid tickets and returns.

---

## The Money Move

### Bundle Logic + Rush

Lead with 3 prebuilt kits that match 80% of orders, plus a Rush toggle:

| Kit | Contents | Base Price | Rush (+30%) |
|---|---|---|---|
| **Escort Starter Kit** | Magnets + flags + basic beacon | ~$179 | ~$233 |
| **OS/OW Pro Kit** | Backlit/wide sign + LED strobe + mirror mounts | ~$299 | ~$389 |
| **High-Pole "Rattler" Kit** | Rattler sections + tip + bag + mount | ~$349 | ~$454 |

### Quick Math
- Base AOV without bundles: **$85**
- Bundle AOV: **$179–$349**
- Attach rate at 30%: **+$36–$62/order** net on same traffic
- Rush surcharge: **+20–40%** on any order

### Priority Lane Subscription ($9.99/mo)
- Free Rush on every order
- Member pricing on all consumables
- Priority restock alerts (sold-out → you get first dibs)
- Compliance Refresh auto-ship (worn flags, dead batteries, faded vests)
- **ARPU compounds** every month they stay

---

## 18 Collections (608 SKUs)

Source file: `HC_AMC_store_seed.csv`

| # | Collection | Typical Items | Lead Vendor |
|---|---|---|---|
| 1 | Signs & Banners | OVERSIZE LOAD signs, backlit signs, permit boards | Safety Flag Co / AMC |
| 2 | Flags & Mounts | Red/orange safety flags, spring mounts, suction mounts | Safety Flag Co |
| 3 | Lighting & Beacons | LED strobes, amber beacons, roof mounts, light bars | ECCO |
| 4 | Radios & Antennas | CB radios, antennas, antenna mounts, cables | US Cargo Control |
| 5 | High-Pole Kits & Parts | Rattler sections, tips, bags, bases, adapters | AMC (Weatherford, TX) |
| 6 | Load Securement & Rigging | Chains, binders, straps, ratchets, edge protectors | US Cargo Control |
| 7 | Safety & Apparel | Class III vests, hard hats, gloves, rain gear | TASCO |
| 8 | Electrical & Connectors | Pigtails, junction boxes, SAE plugs, wire harnesses | AMC / US Cargo Control |
| 9 | Wheels & Mounts | Dolly wheels, caster sets, trailer jacks | US Cargo Control |
| 10 | Truck Parts & Pneumatics | Air hoses, fittings, gladhands, air bags | US Cargo Control |
| 11 | Decals & Labels | HC-branded decals, "PILOT CAR" magnets, permit stickers | BuildASign (white-label) |
| 12 | Locks & Security | Kingpin locks, glad-hand locks, cable locks | US Cargo Control |
| 13 | Training & Certification | State pilot-car training, TWIC prep course, CDL study | Digital (GHL) |
| 14 | Digital Products | Route templates, compliance checklists, SOP docs | Digital (GHL) |
| 15 | On-the-Road Necessities | First aid kits, fire extinguishers, water jugs, tie-downs | TASCO / US Cargo |
| 16 | Mirrors & Visibility | Wide-angle mirrors, mirror extensions, blind-spot mirrors | AMC |
| 17 | Tools & Accessories | Socket sets, impact drivers, tire gauges, multimeters | US Cargo Control |
| 18 | Other | Miscellaneous / new items pending categorization | Various |

---

## Dropship Vendor Network

### Primary Vendors

| Vendor | Location | Strength | Drop-Ship? | Min Order | Blind-Ship? |
|---|---|---|---|---|---|
| **Safety Flag Co.** | Rhode Island | Flags, signs, banners, custom products | ✅ Explicitly stated | None | ✅ "We can drop ship to your customers" |
| **ECCO** | National | Warning beacons, ambers, light bars | ✅ Official program | $135 mixed | ✅ Yes |
| **TASCO** (TX America Safety) | Texas | Safety apparel, PPE, hard hats, vests | ✅ Wholesaler drop-ship | None (no MOQs) | ✅ Yes |
| **US Cargo Control** | National | Rigging, securement, banners, hardware | ⚠️ Not stated but 1-2 day US coverage | Bulk pricing | Negotiate |
| **AMC** | Weatherford, TX | High-pole (Rattler), core HC SKUs | ⚠️ Contact requested | TBD | Request blind-ship |

### Routing Logic (n8n)

```
IF item ∈ {Flags, Signs, Banners, Custom Signage}
    → Route to Safety Flag Co. (blind-ship PO)

ELSE IF item ∈ {Beacons, Strobes, Light Bars, Amber Lights}
    → Route to ECCO (enforce $135 min across SKUs in order)

ELSE IF item ∈ {Vests, Hard Hats, Gloves, PPE, Safety Apparel}
    → Route to TASCO (no MOQ, drop-ship)

ELSE IF item ∈ {Rattler, High-Pole, Pole Tips, Pole Bags, Pole Mounts}
    → Route to AMC (request blind-ship; fallback: WonderPole/Patriot)

ELSE IF item ∈ {Chains, Straps, Rigging, Hardware, Wheels, Tools}
    → Route to US Cargo Control (bulk pricing)

ELSE IF item ∈ {Decals, HC-Branded Items}
    → Route to BuildASign (white-label fulfillment)

ELSE IF item ∈ {Training, Digital Products, Courses}
    → Deliver digitally via GHL (no physical ship)

ELSE
    → Flag for manual review + notify admin
```

---

## Automation Flow: Intake → Validate → Route → Notify → Proof

### 1. Intake (GHL Storefront)

**PDP (Product Detail Page) Chips:**
- 🏛️ "State spec tips" — jurisdiction-specific notes
- 🔗 "What this pairs with" — cross-sell suggestion
- 🕐 "Updated X min ago" — freshness signal

**Upsell Blocks:**
- Kit selector: Starter / Pro / High-Pole Rattler
- Priority Lane toggle ($9.99/mo subscription)
- Rush toggle (+20–40% surcharge)

### 2. Validate (Zero-Human)

```
Step 1: Address + AVS pass → OK
Step 2: AVS fail → Auto-SMS + email to customer: "Fix your address"
Step 3: If item name contains:
        ("Oversize", "Wide", "Sign", "Flag", "Beacon")
        → Show spec reminder:
        "Verify local rules; sizes/colors vary by jurisdiction.
         Common triggers: width ≥12ft, height ≥14'6", length ≥90-100ft.
         'OVERSIZE LOAD' signage required in most states.
         Some states require roof-mounted amber beacons."
        (Not legal advice — return prevention.)
```

### 3. Route (Dropship — n8n PO Bot)

```
┌─────────────────────────────────────────────────────┐
│              n8n PO BOT v1 FLOW                     │
│                                                     │
│  GHL Order Webhook                                  │
│       │                                             │
│       ▼                                             │
│  Parse line items + shipping address                │
│       │                                             │
│       ▼                                             │
│  Route each item to correct vendor (logic above)    │
│       │                                             │
│       ├──▶ Airtable: Create Order record            │
│       │    (Orders table + Lines table)              │
│       │                                             │
│       ▼                                             │
│  PO Builder                                         │
│  ├── Generate PO PDF                                │
│  ├── Generate blind-ship packing slip               │
│  │   (HC branding, no vendor info exposed)          │
│  └── Attach CSV of line items                       │
│       │                                             │
│       ▼                                             │
│  Email to vendor "orders@[vendor].com"              │
│  CC: audit@haulcommand.com                          │
│       │                                             │
│       ▼                                             │
│  ┌─── Wait for tracking ───┐                        │
│  │ Option A: Vendor API     │                       │
│  │ Option B: Parse email    │                       │
│  │   reply for tracking #   │                       │
│  └──────────┬───────────────┘                       │
│             │                                       │
│             ▼                                       │
│  Write tracking → Airtable + GHL contact            │
│       │                                             │
│       ▼                                             │
│  Trigger Notify flow                                │
└─────────────────────────────────────────────────────┘
```

**Fallback:** If vendor can't CSV/API → send structured email + attached CSV. Parse their tracking reply back into system via n8n email parser.

### 4. Notify (SMS + Email Timeline)

| Event | Channel | Message |
|---|---|---|
| Order received | SMS + Email | "✅ Order #HC-XXXX confirmed. We're on it." |
| PO sent to warehouse | Email | "📦 Your order is being prepared at our fulfillment center." |
| Label created | SMS | "🏷️ Shipping label created. Tracking: [link]" |
| Out for delivery | SMS | "🚚 Your gear is out for delivery! Track: [link]" |
| Delivered | SMS + Email | "🎉 Delivered! Need anything? Reply HELP." |

Every status includes: **live tracking link + "Updated X min ago" chip.**

### 5. Proof

- **Auto-PDF receipt** with line items + "Spec Tips" per item + reorder link
- **End-of-day reconciliation** → Airtable Profit table
- **Monthly P&L rollup** → Dashboard metrics in Supabase

---

## GHL CRM Pipeline

### Pipeline: Store — Pain → Feature → Profit

| Stage | Trigger | Auto-Actions |
|---|---|---|
| **New** | Order placed | Create contact, tag items |
| **Paid** | Payment confirmed | Send receipt + spec tips email |
| **PO Sent** | n8n routes PO to vendor | Update contact, start tracking timer |
| **Tracking** | Vendor provides tracking # | SMS tracking link, update Airtable |
| **Delivered** | Carrier confirms delivery | Send "How'd we do?" review request |
| **Review** | 48hrs post-delivery | NPS survey → feeds reputation rail |

### Auto-Tags
- `Order-Rush` — paid rush surcharge
- `Order-Bundle` — purchased a kit (Starter/Pro/Rattler)
- `Priority-Lane` — active subscription member
- `Repeat-Buyer` — 2+ orders
- `High-Value` — order > $300

### Smart Fields
| Field | Derivation | Use |
|---|---|---|
| `JurisdictionHint` | Shipping state | Show relevant spec tips |
| `SpecRisk` | HIGH if sign/flag/light items | Extra validation step |
| `ProfitImpact` | Margin % on order | Dashboard reporting |
| `SLA_Risk` | Days since PO with no tracking | Alert if vendor is slow |

---

## Compliance Partner Affiliates

### Revenue-generating referral partnerships (not liability):

| Partner Type | Example Providers | Revenue Model | HC Touch Point |
|---|---|---|---|
| **DOT Drug & Alcohol Consortium** | goMDnow (~$99/yr), Labworks USA (~$49.95/yr), Online DOT Consortium | Referral fee per signup | Post-verification upsell |
| **Pilot Car / CDL Insurance** | Specialty brokers (independent agents, NAIC listings) | % of first-year premium | During onboarding |
| **TWIC / Credential Assistance** | Third-party expediters, local enrollment centers | Referral cut per completed app | Badge verification flow |
| **FMCSA Clearinghouse** | Clearinghouse query services, consortium reporting partners | Per-query referral | Compliance dashboard |

### Ecosystem Play

When someone buys a **Haul Command Verified Ride-Along badge**:
1. They get flagged as "verified" in the system
2. That badge is trusted by brokers/operators
3. They're offered optional related services (referral revenue):
   - DOT drug consortium membership
   - Pilot car / commercial auto insurance help
   - TWIC application assistance
   - FMCSA Clearinghouse queries

**Single transaction → multiple monetizable touch points.**

---

## Copy Block

> "Need 'OVERSIZE LOAD' gear that won't get you side-eyed by a trooper?
> We box it, brand it, and ship it—fast. Click 'Rush' if you've got a
> Friday curfew breathing down your neck. Starter kit, Pro kit, or the
> High-Pole Rattler—pick your poison, roll in legal, and flex that
> beacon like a Christmas tree in July."

---

## 48-Hour Lock-Ins

- [ ] Import `HC_AMC_store_seed.csv` (608 SKUs) → Airtable "Products" → mirror to GHL via n8n
- [ ] Create 3 Kit products that bundle existing SKUs (no new stock)
- [ ] Turn on Rush as line-item switch (+20–40%)
- [ ] Submit dealer/dropship apps: Safety Flag Co, ECCO, TASCO
- [ ] Ping AMC for wholesale + blind-ship on Rattler kit SKUs
- [ ] Wire PO Bot v1 in n8n
- [ ] Add spec-tip one-liners to all sign/flag/beacon PDPs
- [ ] Set up Priority Lane subscription in Stripe ($9.99/mo recurring)
