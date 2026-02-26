# Compliance Partner Affiliate System
## Turn Single Transactions Into Recurring Revenue Ecosystem

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│          HC VERIFIED OPERATOR ECOSYSTEM                 │
│                                                         │
│  Customer buys gear / gets Verified badge               │
│       │                                                 │
│       ▼                                                 │
│  ┌──────────────────────────────────────┐               │
│  │     POST-PURCHASE UPSELL SEQUENCE    │               │
│  │     (GHL Automation)                 │               │
│  │                                      │               │
│  │  Day 0: Order confirmation           │               │
│  │  Day 2: "Stay compliant" email       │               │
│  │         → DOT Consortium link        │               │
│  │  Day 5: "Protect your rig" email     │               │
│  │         → Insurance partner link     │               │
│  │  Day 10: "Need a TWIC?" SMS          │               │
│  │          → TWIC expediter link       │               │
│  │  Day 14: "FMCSA Clearinghouse" email │               │
│  │          → Clearinghouse partner     │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  Each link → unique affiliate/referral tracking code    │
│  Partner pays HC per conversion or % of sale            │
└────────────────────────────────────────────────────────┘
```

---

## Partner 1: DOT Drug & Alcohol Consortium

### What It Is
Drivers/carriers need DOT random testing compliance. Consortium programs handle the scheduling, random selection, and lab coordination.

### Target Partners

| Provider | Price | HC Opportunity |
|---|---|---|
| **goMDnow** | ~$99/yr unlimited drivers, ~$79/test | Referral fee per signup |
| **Labworks USA** | ~$49.95/yr | Lowest price = highest conversion |
| **Online DOT Consortium** | Varies | Nationwide coverage |

### Integration
- **GHL tag:** After Verified badge → auto-add to "DOT Compliance" email sequence
- **Landing page:** `/compliance/dot-drug-testing` with partner comparison table
- **Revenue:** $10–25 referral per signup (negotiate with each)
- **Tracking:** UTM links per partner: `?ref=haulcommand&partner=gomdnow`

### Copy
> "DOT random testing isn't optional. Get covered in 5 minutes, starting at $49.95/year. We've vetted these programs so you don't get burned by a pop quiz."

---

## Partner 2: Pilot Car / CDL Insurance

### What It Is
Pilot car operators need specialty commercial auto insurance. Most don't know where to find brokers who understand escort vehicles.

### Target Partners
- Independent pilot car insurance brokers (LinkedIn, NAIC listings)
- Specialty commercial auto agencies serving FL/GA/TX carriers
- Owner-operator insurance programs

### Integration
- **GHL tag:** After 2+ orders OR Verified badge → "Insurance Check" sequence
- **Landing page:** `/compliance/insurance` with quote request form
- **Revenue:** 5–10% of first-year premium (standard broker referral)
- **Tracking:** Form submissions → GHL → partner receives lead with HC referral code

### Copy
> "Your beacons are legal. Is your coverage? Get pilot car insurance from brokers who actually know what an escort vehicle is. Quote in 3 minutes."

---

## Partner 3: TWIC Credential Assistance

### What It Is
Transportation Worker Identification Credential — required for port/facility access. The application is confusing, and third-party expediters charge $50–150 to help.

### Target Partners
- Local enrollment centers with expedited processing
- Third-party TWIC form assistance services
- MARAD/TSA TWIC program portal partners

### Integration
- **GHL tag:** If shipping_state IN ("TX", "LA", "CA", "FL", "NJ", "NY", "WA") → TWIC sequence
- **Landing page:** `/compliance/twic` with step-by-step guide + expediter link
- **Revenue:** $15–30 referral per completed application
- **Tracking:** Partner provides dashboard or monthly report

### Copy
> "TWIC card taking forever? Skip the headache. Our vetted partner processes it in half the time. Required for port access — don't let a paper shuffle cost you a load."

---

## Partner 4: FMCSA Clearinghouse

### What It Is
Carriers must query the Clearinghouse before hiring drivers. Services help with registration, queries, and drug/alcohol violation reporting.

### Target Partners
- Clearinghouse query services
- Consortium partners that handle reporting
- HR compliance platforms for small fleets

### Integration
- **GHL tag:** After Verified badge + business entity detected → Clearinghouse sequence
- **Landing page:** `/compliance/clearinghouse` with guide + partner link
- **Revenue:** Per-query referral ($5–15 per query)
- **Tracking:** API callback or monthly report

### Copy
> "Hiring a driver? You legally have to query the Clearinghouse first. Our partner handles it so you don't trip over FMCSA paperwork."

---

## Revenue Projections

| Partner Type | Referral/Sale | Monthly Volume Est. | Monthly Revenue |
|---|---|---|---|
| DOT Consortium | $15 avg | 50 signups | $750 |
| Insurance | $200 avg (5% of $4K policy) | 20 quotes that convert | $4,000 |
| TWIC | $20 avg | 30 applications | $600 |
| Clearinghouse | $10 avg | 40 queries | $400 |
| **Total** | | | **$5,750/mo** |

At scale (10x traffic): **$57,500/mo** in pure affiliate revenue with zero inventory, zero fulfillment, zero support.

---

## GHL Automation Sequences

### Sequence: "Compliance Ecosystem" (Post-Purchase)

```
Trigger: Order delivered + contact has tag "Verified" OR 2+ orders

Day 0: [No action — let them enjoy their gear]

Day 2: Email — "Your Gear's Here. Is Your Compliance?"
  Body: DOT consortium overview + link
  CTA: "Get covered for $49.95/yr →"

Day 5: SMS — "Quick Q: Is your pilot car insured right?"
  Body: "Most operators are underinsured. Get a 3-min quote →"
  Link: /compliance/insurance

Day 10: Email — "Port Loads Pay More. Got Your TWIC?"
  Body: TWIC explainer + expediter link
  CTA: "Start your application →"
  Condition: Only if shipping_state IN port states

Day 14: Email — "One More Thing: FMCSA Clearinghouse"
  Body: Clearinghouse query tool + partner link
  Condition: Only if business entity detected

Day 21: SMS — "Still need compliance help? Reply HELP"
  Body: Links to all 4 partner services
```

### Sequence: "Priority Lane Compliance Bundle"

```
Trigger: Priority Lane subscription active

Day 0: Welcome email with ALL compliance partner links
  Subject: "Your Priority Lane perks include compliance savings"
  Body: 10% discount codes for all partners (negotiated exclusive)

Month 3: "Compliance Checkup" email
  Body: Automated reminder for DOT test, insurance renewal, TWIC expiry
  Dynamic: Pull expiry dates from GHL custom fields

Month 12: "Annual Compliance Review"
  Body: Full recap + renewal links
```

---

## Tracking Dashboard (Supabase)

```sql
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,      -- 'gomdnow', 'ecco_insurance', etc.
    partner_type TEXT NOT NULL,      -- 'consortium', 'insurance', 'twic', 'clearinghouse'
    referral_code TEXT NOT NULL,     -- Unique tracking code
    contact_id TEXT,                 -- GHL contact ID
    contact_email TEXT,
    click_date TIMESTAMPTZ,
    conversion_date TIMESTAMPTZ,
    conversion_value NUMERIC,       -- Revenue earned from this referral
    status TEXT DEFAULT 'clicked',   -- 'clicked', 'applied', 'converted', 'paid'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    referrals_count INTEGER DEFAULT 0,
    total_payout NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- 'pending', 'invoiced', 'paid'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
