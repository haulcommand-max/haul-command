# Trust & Crowd Intelligence Layer — Implementation Plan

> **For Antigravity:** Use subagent-driven-development to execute task-by-task.

**Goal:** Install structured, fraud-resistant operational reputation for escorts and brokers, plus a Waze-style crowd signal layer feeding the Pulse Feed.

**Architecture:** 4 new DB tables → verified reviews flow through trust score recalculation → crowd signals expire automatically → Pulse picks up high-priority events. Frontend: upgrade ReviewForm to 5-axis, add BrokerReviewForm, BrokerPayCard, CrowdSignalBar.

**Tech Stack:** Next.js 14 (App Router), Supabase, TypeScript, Tailwind/hc-tokens, Lucide icons, Framer Motion

---

## What Already Exists (DO NOT RECREATE)

| Asset | Status |
|---|---|
| `components/directory/ReviewCard.tsx` | ✅ 3-axis display card, verified badge |
| `components/directory/ReviewForm.tsx` | ✅ 3-axis star input, 500-char body, photo upload |
| `supabase/migrations/20260220_broker_report_card_crowd_signals.sql` | ✅ `v_broker_report_card` view + `community_votes` |
| `supabase/migrations/20260220_dual_trust_wing_and_report_card.sql` | ✅ `compute_escort_report_card()` + `compute_broker_trust_score()` |

---

## Task 1: Database — 4 New Tables

**Files:**
- Create: `supabase/migrations/20260222_trust_crowd_intelligence.sql`

### Step 1: Write the migration

```sql
-- ============================================================
-- Trust & Crowd Intelligence — 4 Core Tables
-- ============================================================

-- 1. escort_reviews (5-axis operational reviews from brokers)
CREATE TABLE IF NOT EXISTS public.escort_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id UUID NOT NULL REFERENCES public.escort_profiles(escort_id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
    on_time_rating SMALLINT NOT NULL CHECK (on_time_rating BETWEEN 1 AND 5),
    communication_rating SMALLINT NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating SMALLINT NOT NULL CHECK (professionalism_rating BETWEEN 1 AND 5),
    equipment_ready_rating SMALLINT NOT NULL CHECK (equipment_ready_rating BETWEEN 1 AND 5),
    route_awareness_rating SMALLINT NOT NULL CHECK (route_awareness_rating BETWEEN 1 AND 5),
    would_use_again BOOLEAN NOT NULL DEFAULT true,
    review_text TEXT CHECK (char_length(review_text) <= 500),
    verified_job BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (escort_id, broker_id, load_id)  -- one review per job pair
);

CREATE INDEX idx_escort_reviews_escort ON public.escort_reviews(escort_id);
CREATE INDEX idx_escort_reviews_broker ON public.escort_reviews(broker_id);
ALTER TABLE public.escort_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can insert reviews" ON public.escort_reviews
    FOR INSERT WITH CHECK (broker_id = auth.uid());
CREATE POLICY "Anyone can read reviews" ON public.escort_reviews
    FOR SELECT USING (true);
CREATE POLICY "Service role manages reviews" ON public.escort_reviews
    FOR ALL USING (auth.role() = 'service_role');

-- 2. broker_reviews (5-axis escort-submitted reviews of brokers)
CREATE TABLE IF NOT EXISTS public.broker_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    escort_id UUID NOT NULL REFERENCES public.escort_profiles(escort_id) ON DELETE SET NULL,
    load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
    paid_on_time_rating SMALLINT NOT NULL CHECK (paid_on_time_rating BETWEEN 1 AND 5),
    rate_accuracy_rating SMALLINT NOT NULL CHECK (rate_accuracy_rating BETWEEN 1 AND 5),
    communication_rating SMALLINT NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
    load_clarity_rating SMALLINT NOT NULL CHECK (load_clarity_rating BETWEEN 1 AND 5),
    detention_fairness_rating SMALLINT NOT NULL CHECK (detention_fairness_rating BETWEEN 1 AND 5),
    would_work_again BOOLEAN NOT NULL DEFAULT true,
    review_text TEXT CHECK (char_length(review_text) <= 500),
    verified_job BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (broker_id, escort_id, load_id)  -- one review per job pair
);

CREATE INDEX idx_broker_reviews_broker ON public.broker_reviews(broker_id);
CREATE INDEX idx_broker_reviews_escort ON public.broker_reviews(escort_id);
ALTER TABLE public.broker_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escorts can insert broker reviews" ON public.broker_reviews
    FOR INSERT WITH CHECK (escort_id = auth.uid());
CREATE POLICY "Anyone can read broker reviews" ON public.broker_reviews
    FOR SELECT USING (true);
CREATE POLICY "Service role manages broker reviews" ON public.broker_reviews
    FOR ALL USING (auth.role() = 'service_role');

-- 3. broker_pay_events (for pay score tracking)
CREATE TABLE IF NOT EXISTS public.broker_pay_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    invoice_submitted_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    days_to_pay INT GENERATED ALWAYS AS (
        CASE WHEN paid_at IS NOT NULL
        THEN EXTRACT(DAY FROM paid_at - invoice_submitted_at)::INT
        ELSE NULL END
    ) STORED,
    on_time_flag BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broker_pay_events_broker ON public.broker_pay_events(broker_id);
ALTER TABLE public.broker_pay_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages pay events" ON public.broker_pay_events
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Anyone can read pay events" ON public.broker_pay_events
    FOR SELECT USING (true);

-- 4. crowd_signals (waze-style field alerts)
CREATE TABLE IF NOT EXISTS public.crowd_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    corridor_id TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'corridor_heating', 'police_required', 'height_issue',
        'permit_tight', 'route_delay', 'coverage_tightening', 'bridge_clearance_watch'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    latitude NUMERIC,
    longitude NUMERIC,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crowd_signals_corridor ON public.crowd_signals(corridor_id);
CREATE INDEX idx_crowd_signals_expires ON public.crowd_signals(expires_at);
ALTER TABLE public.crowd_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can report signals" ON public.crowd_signals
    FOR INSERT WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "Anyone can read active signals" ON public.crowd_signals
    FOR SELECT USING (expires_at > now());
CREATE POLICY "Service role manages signals" ON public.crowd_signals
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Aggregate views for trust scores from reviews
CREATE OR REPLACE VIEW public.v_escort_review_scores AS
SELECT
    escort_id,
    COUNT(*) AS review_count,
    COUNT(*) FILTER (WHERE verified_job) AS verified_count,
    ROUND(AVG(on_time_rating)::numeric, 2) AS avg_on_time,
    ROUND(AVG(communication_rating)::numeric, 2) AS avg_communication,
    ROUND(AVG(professionalism_rating)::numeric, 2) AS avg_professionalism,
    ROUND(AVG(equipment_ready_rating)::numeric, 2) AS avg_equipment,
    ROUND(AVG(route_awareness_rating)::numeric, 2) AS avg_route_awareness,
    ROUND(((AVG(on_time_rating) * 0.30 +
             AVG(communication_rating) * 0.20 +
             AVG(professionalism_rating) * 0.15 +
             AVG(equipment_ready_rating) * 0.10 +
             AVG(route_awareness_rating) * 0.10) / 5.0 * 100)::numeric, 1) AS review_trust_score,
    ROUND(100.0 * COUNT(*) FILTER (WHERE would_use_again) / NULLIF(COUNT(*), 0)::numeric, 1) AS would_use_again_pct
FROM public.escort_reviews
GROUP BY escort_id;

GRANT SELECT ON public.v_escort_review_scores TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_broker_review_scores AS
SELECT
    broker_id,
    COUNT(*) AS review_count,
    COUNT(*) FILTER (WHERE verified_job) AS verified_count,
    ROUND(AVG(paid_on_time_rating)::numeric, 2) AS avg_paid_on_time,
    ROUND(AVG(rate_accuracy_rating)::numeric, 2) AS avg_rate_accuracy,
    ROUND(AVG(communication_rating)::numeric, 2) AS avg_communication,
    ROUND(AVG(load_clarity_rating)::numeric, 2) AS avg_load_clarity,
    ROUND(AVG(detention_fairness_rating)::numeric, 2) AS avg_detention_fairness,
    ROUND(((AVG(paid_on_time_rating) * 0.45 +
             AVG(rate_accuracy_rating) * 0.20 +
             AVG(communication_rating) * 0.15 +
             AVG(load_clarity_rating) * 0.10 +
             AVG(detention_fairness_rating) * 0.10) / 5.0 * 100)::numeric, 1) AS broker_pay_score,
    ROUND(100.0 * COUNT(*) FILTER (WHERE would_work_again) / NULLIF(COUNT(*), 0)::numeric, 1) AS would_work_again_pct
FROM public.broker_reviews
GROUP BY broker_id;

GRANT SELECT ON public.v_broker_review_scores TO anon, authenticated;
```

### Step 2: Apply migration locally
```bash
# Push to local Supabase dev
npx supabase db push
# OR apply via Supabase MCP tool
```

### Step 3: Verify
Check in Supabase Table Editor that all 4 tables exist with correct columns.

---

## Task 2: Upgrade EscortReviewForm to 5-Axis

**Files:**
- Modify: `components/directory/ReviewForm.tsx`

Current ReviewForm has 3 axes (Punctuality, Communication, Equipment). Upgrade to 5 axes per YAML:
- on_time (was Punctuality) 
- communication (unchanged)
- professionalism (new — replaces Equipment)
- equipment_ready (new — separate from professionalism)
- route_awareness (new)
- would_use_again boolean toggle (new)

Also update the API payload field names to match the new DB columns.

### Step 1: Update StarInput axes in ReviewForm.tsx

Change axes:
```tsx
// OLD (3-axis)
const [punctuality, setPunctuality] = useState(0);
const [communication, setCommunication] = useState(0);
const [equipment, setEquipment] = useState(0);

// NEW (5-axis)
const [onTime, setOnTime] = useState(0);
const [communication, setCommunication] = useState(0);
const [professionalism, setProfessionalism] = useState(0);
const [equipmentReady, setEquipmentReady] = useState(0);
const [routeAwareness, setRouteAwareness] = useState(0);
const [wouldUseAgain, setWouldUseAgain] = useState(true);

const isValid = onTime > 0 && communication > 0 && professionalism > 0 && equipmentReady > 0 && routeAwareness > 0;
```

Add `WouldUseAgain` toggle above submit button:
```tsx
<div className="flex items-center justify-between py-3 border-y border-hc-border-bare">
    <span className="text-[11px] font-bold text-hc-text uppercase tracking-widest">Would Use Again?</span>
    <button
        type="button"
        onClick={() => setWouldUseAgain(v => !v)}
        className={cn("px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border transition-all",
            wouldUseAgain
                ? "bg-hc-success/10 border-hc-success/30 text-hc-success"
                : "bg-hc-danger/10 border-hc-danger/30 text-hc-danger"
        )}
    >
        {wouldUseAgain ? "✓ Yes" : "✗ No"}
    </button>
</div>
```

Update the body_payload to use new field names:
```tsx
const body_payload = {
    escort_id: escortId,
    load_id: jobId,
    on_time_rating: onTime,
    communication_rating: communication,
    professionalism_rating: professionalism,
    equipment_ready_rating: equipmentReady,
    route_awareness_rating: routeAwareness,
    would_use_again: wouldUseAgain,
    review_text: body.trim() || null,
};
```

### Step 2: Update API route to target new table
- Modify: `app/api/directory/reviews/route.ts` (or create if it doesn't exist)
- Point INSERT to `escort_reviews` table instead of any legacy table

### Step 3: Update ReviewCard.tsx to display 5 axes
Add `route_awareness` and `professionalism` rows to StarRow display.
Also add "Would Use Again" indicator in the footer.

---

## Task 3: BrokerReviewForm (New Component)

**Files:**
- Create: `components/trust/BrokerReviewForm.tsx`

5-axis broker review submitted by escorts. These are the high-leverage reviews that no other platform does.

```tsx
// 5 axes:
// 1. Paid on Time (0.45 weight — HIGHEST)
// 2. Rate Accuracy
// 3. Communication  
// 4. Load Clarity
// 5. Detention Fairness
// + Would Work Again toggle

// Same StarInput pattern as ReviewForm.tsx
// POST to /api/trust/broker-reviews
// Emphasize "Paid on Time" as the hero axis with special styling
```

**API route:** `app/api/trust/broker-reviews/route.ts`
- INSERT into `broker_reviews` table
- Verify `escort_id = auth.uid()` server-side

---

## Task 4: BrokerPayCard Component (Load Board Hover)

**Files:**
- Create: `components/trust/BrokerPayCard.tsx`

Displays broker pay score on the load board — the key differentiator. Shows:
- **Pay Score** (big number, gold)
- Avg days to pay
- Paid on time %
- Would work again %
- Risk flags (slow pay warning >21 days, dispute rate >12%)
- Tier badge (Platinum/Gold/Verified/Standard/Watch List)

```tsx
// Data source: v_broker_review_scores JOIN v_broker_report_card
// Props: brokerId, compact?: boolean (for hover preview vs full card)
// Styling: hc-card, gold emphasized score, red flag chips for risk alerts
```

---

## Task 5: CrowdSignalBar Component + Pulse Integration

**Files:**
- Create: `components/feed/CrowdSignalBar.tsx`
- Modify: `components/feed/LiveActivityFeed.tsx` (add crowd_signal event types)

### CrowdSignalBar
A compact report button strip that authenticated users see above the corridor map.
7 signal types from the YAML, rendered as tappable chips:

```tsx
const SIGNAL_TYPES = [
    { type: 'corridor_heating',      label: 'Lane Hot',       icon: Flame,        severity: 'high' },
    { type: 'police_required',       label: 'Police Escort',  icon: Shield,       severity: 'high' },
    { type: 'height_issue',          label: 'Height Issue',   icon: AlertTriangle, severity: 'critical' },
    { type: 'permit_tight',          label: 'Permit Tight',   icon: FileX,        severity: 'medium' },
    { type: 'route_delay',           label: 'Route Delay',    icon: Clock,        severity: 'medium' },
    { type: 'coverage_tightening',   label: 'Coverage Low',   icon: Users,        severity: 'high' },
    { type: 'bridge_clearance_watch',label: 'Bridge Watch',   icon: AlertCircle,  severity: 'critical' },
] as const;
// One tap = report with auto-expiry based on severity
// POST to /api/signals/crowd
```

### Pulse Integration
Add to `LiveActivityFeed.tsx` EVENT_CONFIG:
```tsx
crowd_signal_high: {
    label: (e) => `Field alert — ${e.corridor}: ${e.signal_type}`,
    icon: Radio,
    barColor: 'bg-hc-warning',
    type: 'crowd_signal_high',
    priority: 'high',
},
crowd_signal_critical: {
    label: (e) => `⚠ CRITICAL — ${e.corridor}: ${e.signal_type}`,
    icon: Radio,
    barColor: 'bg-hc-danger',
    type: 'crowd_signal_critical',
    priority: 'critical'
},
```

---

## Task 6: API Routes

**Files to create:**
- `app/api/directory/reviews/route.ts` — escort review submission → `escort_reviews`
- `app/api/trust/broker-reviews/route.ts` — broker review submission → `broker_reviews`
- `app/api/signals/crowd/route.ts` — crowd signal submission → `crowd_signals`

Each route must:
1. Validate authenticated session (`getSession()`)
2. Validate payload (required fields, rating bounds 1-5)
3. INSERT with `service_role` client (bypass RLS for server)
4. Return `{ success: true }` or structured error

The escort reviews route specifically should:
- On success, call `compute_escort_report_card(escort_id)` via supabase RPC to refresh score

---

## Verification Plan

### Automated
```bash
# TypeScript compile check
npx tsc --noEmit

# Next.js build (catches all import/type errors)
npm run build
```

### Manual Browser Tests
1. Navigate to `/directory` — CrowdSignalBar should appear above map for authenticated users
2. Click a signal chip (e.g. "Lane Hot") — should show confirmation toast, POST to `/api/signals/crowd`, new row in `crowd_signals` table
3. Navigate to escort profile — see Review section with NEW 5-axis display (On Time, Communication, Professionalism, Equipment, Route Awareness + Would Use Again %)
4. Submit a review — form POSTs to `/api/directory/reviews`, new row in `escort_reviews`
5. Navigate to a load card — broker pay score chip should be visible
6. Check Pulse Feed — crowd signals with severity high/critical appear with appropriate priority chip
