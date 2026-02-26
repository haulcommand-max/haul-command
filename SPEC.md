# HAUL COMMAND OS — SPECIFICATION
**Version**: 2.0 | **Date**: 2026-02-18

> This is the **Spec Accumulator** — design decisions, contracts, formulas, and policies.
> It does NOT describe deployed state. For that, see `DEPLOYED.md`.
> For build phases and folder structure, see `BUILD_MANIFEST.md`.

---

## 1. SYSTEM OVERVIEW

Three surfaces, one Supabase spine:

| Surface | Route root | Primary user | Purpose |
|---|---|---|---|
| Directory | `haul-command-hub/` | Public / SEO | Trust + discovery + lead gen |
| Load Board | `/loads` | Driver + Broker | Marketplace / matching |
| Mobile App | React Native | Driver | Utility + retention + realtime |

**National UX, narrow ops**: UI shows all 50 states + Canada. Live operations: FL + GA only at launch.

---

## 2. CANONICAL NAMES

| Use this | Not this |
|---|---|
| **Load Board** | Lead Board, Marketplace |
| **Compliance Score** | CCS Score, trust score (for scoring rollup) |
| **Provider** | Driver (in directory/SEO context) |
| **Driver** | Provider (in marketplace/mobile context) |
| **Greenlight Match** | Auto-Block |
| **Intelligence Bus (`uib`)** | UIB, IntelligenceBus |
| **SyncQueue** | offline queue, local queue |

---

## 3. DRIVER TRUST SCORE

```
TrustScore = 100 × (0.22·I + 0.18·C + 0.12·E + 0.10·A + 0.12·R + 0.16·J + 0.10·F)
```

### Component definitions — all normalized 0..1

| Var | Name | Formula | Update cadence |
|---|---|---|---|
| I | insurance_valid | `1.0` if active policy on file; `0.0` otherwise | On cert upload / expiry event |
| C | cert_coverage | `verified_cert_count / required_cert_count_for_tier` | On cert upload / expiry event |
| E | equipment_match | `1.0` if load dims ≤ equipment capacity; `0.0` if load exceeds capacity | On equipment update |
| A | activity_score | `1.0` if active ≤24h; `0.5` if ≤7d; `0.0` if >30d | Realtime (presence update) |
| R | rating_score | `AVG(review_stars) / 5.0`; default `0.5` until ≥3 reviews | On review submit |
| J | jobs_safely | `MIN(incident_free_jobs / 50, 1.0)` | On job completion |
| F | funds_verified | `1.0` if Stripe pre-auth cleared on last job; `0.0` otherwise | On payment capture |

**Storage**: `scoring_rollups.trust_score` (integer 0–100).
**Full recompute**: nightly CRON via `hazard-score-rollup` edge function.
**Partial recompute**: triggered on each cadence event above.
**Minimum for load matching**: configurable per load (`loads.min_score`).

---

## 4. MATCH SCORE

```
MatchScore = 100 × (0.40·Dist + 0.25·Equip + 0.20·Compliance + 0.15·Interest)
```

| Var | Name | Formula |
|---|---|---|
| Dist | proximity_score | `MAX(0, 1 - (deadhead_miles / 300))` (300mi cap) |
| Equip | equipment_match | `1.0` exact; `0.7` overcapacity; `0.0` under |
| Compliance | compliance_ratio | `driver.trust_score / 100` |
| Interest | interest_score | `1.0` applied; `0.7` viewed; `0.5` default |

**Top 3 labels**:
- ≥ 85 → **Sure Thing**
- 70–84 → **Best Value**
- 50–69 → **Speedster**
- < 50 → not surfaced in Top 3

---

## 5. GREENLIGHT MATCH — WARN vs BLOCK

```typescript
export type MatchDecision = 'GREENLIGHT' | 'WARN' | 'BLOCKED';
export interface MatchResult { decision: MatchDecision; reasons: string[]; }

export function greenlightMatch(load: Load, driver: Driver): MatchResult {
  // HARD BLOCKS — only 3 conditions, nothing else blocks
  const missingCerts = load.required_certs.filter(c => !driver.certs.includes(c));
  if (missingCerts.length > 0)
    return { decision: 'BLOCKED', reasons: [`Missing required certs: ${missingCerts.join(', ')}`] };
  if (driver.trust_score === 0)
    return { decision: 'BLOCKED', reasons: ['Identity unverified (compliance score = 0)'] };
  if (!load.rate_usd || load.rate_usd <= 0 || isNaN(load.rate_usd))
    return { decision: 'BLOCKED', reasons: ['Invalid rate: must be a positive number'] };

  // WARNINGS — surfaced to user, never prevent proceeding
  const reasons: string[] = [];
  if (driver.trust_score < load.min_score)
    reasons.push(`Score ${driver.trust_score} below load minimum ${load.min_score}`);
  const daysInsurance = daysBetween(new Date(), driver.insurance_expiry);
  if (daysInsurance <= 14)
    reasons.push(`Insurance expires in ${daysInsurance} days`);
  driver.cert_expiries?.filter(e => daysBetween(new Date(), e.expiry) <= 30)
    .forEach(e => reasons.push(`Cert expiring soon: ${e.cert}`));

  return { decision: reasons.length ? 'WARN' : 'GREENLIGHT', reasons };
}
```

**UI contract**:
- `GREENLIGHT` → green proceed badge
- `WARN` → amber banner, broker can override, driver sees advisory
- `BLOCKED` → red, cannot proceed until condition resolved

**Pricing guardrails** (`pricing_guardrails_mode = 'warn'`):
- Warn: rate below corridor average (show but allow)
- Block: `rate_usd <= 0` or `isNaN(rate_usd)` only

---

## 6. NOTIFICATION INBOX (in-app storage + push delivery)

### Model
Push is **delivery**. Supabase is **storage**. Never rely on push receipt to determine if user was notified.

### `notification_events` table
```sql
CREATE TABLE notification_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,          -- see types below
  title         TEXT NOT NULL,
  body          TEXT,
  payload       JSONB DEFAULT '{}',
  read_at       TIMESTAMPTZ,            -- NULL = unread
  push_sent_at  TIMESTAMPTZ,            -- NULL = not yet attempted
  push_status   TEXT DEFAULT 'pending', -- pending | sent | failed | skipped
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON notification_events (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX ON notification_events (user_id, created_at DESC);
```

### Notification types
| type | Trigger | Throttle |
|---|---|---|
| `LOAD_MATCH` | New load matches driver | 1 per driver per 5min |
| `COMPLIANCE_WARNING` | Cert/insurance expiring | 1 per cert per 24h |
| `CURFEW_REMINDER` | Upcoming curfew window | 1 per curfew entry |
| `PAYMENT_UPDATE` | Payment status change | No throttle |
| `REVIEW_RECEIVED` | New review posted | 1 per review |
| `ADMIN_ALERT` | Platform admin message | No throttle |
| `JOB_STATUS` | Job accepted/completed | No throttle |

### Inbox flow
1. Any system event → INSERT into `notification_events` (always)
2. Edge function attempts FCM push → updates `push_sent_at` + `push_status`
3. Mobile/web app queries `notification_events WHERE read_at IS NULL` → badge count
4. User opens inbox → mark `read_at = NOW()`

### RLS on notification_events
```sql
-- Users see only their own notifications
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read" ON notification_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service_write" ON notification_events
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 7. NOTIFICATION DELIVERY + SMS ESCALATION

### Delivery pipeline
```
1. INSERT notification_events row (push_status = 'pending')
2. Attempt FCM push
   → success: update push_status = 'sent', push_sent_at = NOW()
   → fail (invalid token): push_status = 'failed', stop
   → fail (network): retry ×3 exponential backoff (1s, 5s, 30s)
   → fail after retries: push_status = 'failed'
3. If push_status = 'failed':
   → check sms_escalation eligibility (see below)
   → if eligible: queue SMS, update push_status = 'sms_escalated'
```

### SMS escalation — exact conditions (all must be true)
```
feature flag: sms_fallback_enabled = true
AND user.sms_opt_in = true
AND user.phone_verified = true
AND consecutive_push_failures >= 2       -- for this user, in last 24h
AND notification type NOT IN ('LOAD_MATCH')  -- high-frequency types excluded from SMS
AND last_sms_sent_at < NOW() - INTERVAL '1 hour'  -- per-user SMS throttle
```

### FCM token lifecycle
| Event | Action |
|---|---|
| App launch | Register token → upsert `driver_fcm_tokens.token` |
| Token refresh | `driver-presence-update` edge fn upserts new token |
| `NOT_REGISTERED` from FCM | Mark token invalid, stop sending, flag for re-registration |
| App reinstall | New token captured on next launch |

---

## 8. OFFLINE SYNCQUEUE CONTRACT

### Event schema
```typescript
interface SyncEvent {
  id: string;              // UUID — idempotency key (client-generated)
  type: SyncEventType;
  payload: Record<string, unknown>;
  created_at: number;      // Unix ms
  attempts: number;
  last_attempt_at?: number;
  status: 'pending' | 'syncing' | 'done' | 'failed';
}

type SyncEventType =
  | 'PRESENCE_UPDATE'
  | 'LOAD_VIEW'
  | 'LOAD_APPLY'
  | 'EVIDENCE_UPLOAD'
  | 'HANDSHAKE_LOG'
  | 'REVIEW_SUBMIT';
```

### Retry schedule
| Attempt | Delay after previous |
|---|---|
| 1 | Immediate |
| 2 | 5s |
| 3 | 30s |
| 4 | 5min |
| 5 | 30min |
| 6+ | 30min, TTL 24h then mark `failed` |

### Conflict resolution
| Event type | Rule |
|---|---|
| `PRESENCE_UPDATE` | Last-write-wins (compare `created_at`) |
| `LOAD_APPLY` | Server wins — verify load still `open` before applying |
| `EVIDENCE_UPLOAD` | Client always wins (additive, no server conflict possible) |
| `HANDSHAKE_LOG` | Append-only, idempotent by `id` |
| `REVIEW_SUBMIT` | Server wins — reject duplicate `(job_id, reviewer_id)` |
| `LOAD_VIEW` | Fire-and-forget, no conflict |

### Storage
- React Native: `AsyncStorage` prefixed `syncqueue:{id}`
- Web: `localStorage` prefixed `syncqueue:{id}`
- Max queue depth: 200 events; evict oldest `done` first when full

---

## 9. IDEMPOTENCY KEYS — ALL CRITICAL OPERATIONS

Every mutation that has side effects (money, legal evidence, state changes) requires an idempotency key.

### Key format: `{operation}:{primary_id}:{secondary_id}:{version}`

| Operation | Idempotency key | Storage |
|---|---|---|
| Pre-auth | `preauth:{load_id}:{driver_id}:{broker_id}` | `idempotency_keys` table |
| Capture | `capture:{payment_intent_id}` | `idempotency_keys` table |
| Compliance snapshot | `snapshot:{job_id}:{driver_id}` | `idempotency_keys` table |
| Handshake log entry | `handshake:{job_id}:{event_type}:{unix_minute}` | Dedupe on insert |
| SyncQueue event | Client-generated UUID | `SyncEvent.id` |
| Referral redeem | `referral:{referral_code}:{new_user_id}` | `idempotency_keys` table |
| Review submit | `(job_id, reviewer_id)` unique constraint | DB constraint |

### `idempotency_keys` table
```sql
CREATE TABLE idempotency_keys (
  key         TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'processing', -- processing | done | failed
  response    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
```

### Edge function pattern
```typescript
// Every mutating edge function starts with:
async function withIdempotency(key: string, fn: () => Promise<any>) {
  const existing = await supabase.from('idempotency_keys').select().eq('key', key).single();
  if (existing.data?.status === 'done') return existing.data.response;  // replay
  if (existing.data?.status === 'processing') throw new Error('409: In progress');
  await supabase.from('idempotency_keys').insert({ key, status: 'processing' });
  try {
    const result = await fn();
    await supabase.from('idempotency_keys').update({ status: 'done', response: result }).eq('key', key);
    return result;
  } catch (err) {
    await supabase.from('idempotency_keys').update({ status: 'failed' }).eq('key', key);
    throw err;
  }
}
```

---

## 10. ROUTING STORAGE CONTRACT

**Rule**: Store only waypoints. Never persist polyline geometry.

```typescript
interface RouteWaypoints {
  job_id: string;
  start: { lat: number; lng: number; address: string };
  end:   { lat: number; lng: number; address: string };
  waypoints: Array<{ lat: number; lng: number; label?: string }>;
}
```

Polyline computed on-demand, cached in memory for active job session only, never written to DB.

---

## 11. RBAC + RLS POLICY

### Roles
| Role | Identity |
|---|---|
| `anon` | Unauthenticated public (SEO reads) |
| `driver` | JWT with `role = 'driver'` |
| `broker` | JWT with `role = 'broker'` |
| `org_admin` | JWT with `role = 'org_admin'` |
| `admin` | JWT with `role = 'admin'` |
| `service_role` | Supabase service key (edge functions only) |

### Public safe views (SEO — no PII)
```sql
CREATE VIEW public.v_providers_seo AS
  SELECT id, slug, display_name, service_area, coverage_status,
         compliance_score, verified_badge, equipment_summary,
         city, state, created_at
  FROM providers
  WHERE coverage_status IN ('live', 'onboarding');

CREATE VIEW public.v_loads_teaser AS
  SELECT id, pickup_state, dropoff_state, load_type, posted_at
  FROM loads WHERE status = 'open';
  -- rate_usd and broker_name EXCLUDED
```

---

## 12. COVERAGE UX

| `coverage_status` | Color | Primary CTA | Secondary CTA |
|---|---|---|---|
| `live` | 🟢 green | **BOOK NOW** | Search Map |
| `onboarding` | 🟡 yellow | **CLAIM PROFILE** | Request Custom Match |
| `coming_soon` | ⚪ gray | **JOIN WAITLIST** | — |

**Invariant**: "Post a Load" always visible in nav + footer, regardless of region status.

**Launch regions**: FL + GA = `live`. All other US states + Canada = `onboarding`.

---

## 13. FEATURE FLAGS

| Flag | Default | Notes |
|---|---|---|
| `clearance_data_enabled` | `false` | Proprietary clearance dataset |
| `pricing_guardrails_mode` | `'warn'` | Options: `warn` \| `block_invalid_only` |
| `route_geometry_mode` | `'waypoints_only'` | Never store polylines |
| `offline_sync_queue` | `true` | SyncQueue active |
| `sms_fallback_enabled` | `false` | Must also have user opt-in |
| `directory_surface_enabled` | `true` | SEO directory live |
| `notifications_fcm_enabled` | `true` | FCM push active |
| `national_coverage_mode` | `'mixed'` | FL/GA=live, rest=onboarding |
| `load_board_enabled` | `true` | Marketplace live |
| `defense_packet_enabled` | `false` | Phase 4 |
| `instant_pay_enabled` | `false` | Phase 3 |

---

## 14. FIREBASE / SUPABASE BOUNDARY

| Responsibility | Owner |
|---|---|
| Identity (auth, JWT, RBAC) | Supabase |
| All business state | Supabase |
| Load Board, scoring, audit, payments | Supabase |
| Push notification **delivery** | Firebase FCM |
| Notification **storage + inbox** | Supabase (`notification_events`) |
| Mobile crash reporting | Firebase Crashlytics (optional) |
| Mobile analytics | Firebase Analytics → mirror to Supabase `analytics_events` |
| Realtime presence | Supabase Realtime |

**Rule**: Firebase holds zero business state. Delivery layer only.

---

## 15. SEO + PROGRAMMATIC PAGES

### Routes
| Route | Page type |
|---|---|
| `/` | Home |
| `/services` | Service list |
| `/service-area` | Footprint map |
| `/compliance-proof` | Equipment checklist + cert badges |
| `/states/[state]` | State pillar |
| `/states/[state]/[city]` | City hub |
| `/providers/[slug]` | Provider profile |
| `/united-states` | US hub |
| `/canada` | Canada hub |
| `/corridors/[corridor]` | Corridor hub (I-10 etc) |
| `/ports/[port]` | Port hub |
| `/regulatory-db` | Public authority: curfews + rules |
| `/loads` | Load Board teaser |
| `/loads/[id]` | Blurred load detail + CTA |
| `/post-a-load` | Load intake |

### Thin-content immunity (required on every programmatic page)
1. ≥1 unique local stat (e.g. `"${n} active providers in ${city}"`)
2. Last activity timestamp (`"Last match: 3 hours ago"`)
3. `<GatedCTA>` with live region status

### Sitemap sharding
| File | Threshold |
|---|---|
| `sitemap-states.xml` | < 200 URLs |
| `sitemap-cities-[n].xml` | ≤ 10,000 URLs / file |
| `sitemap-providers-[n].xml` | ≤ 10,000 URLs / file |
| `sitemap-corridors.xml` | < 500 URLs |

---

## 16. EDGE FUNCTIONS CONTRACT

| Function | Auth | Idempotency key |
|---|---|---|
| `deadhead-estimate` | driver JWT | none (read-only) |
| `compliance-match-preview` | driver/broker JWT | none (read-only) |
| `compliance-reminders-run` | service_role | none (CRON, additive) |
| `compliance-snapshot-generate` | service_role | `snapshot:{job_id}:{driver_id}` |
| `payments-preauth` | broker JWT | `preauth:{load_id}:{driver_id}:{broker_id}` |
| `payments-capture` | service_role | `capture:{payment_intent_id}` |
| `driver-presence-update` | driver JWT | none (last-write-wins) |
| `hazard-score-rollup` | service_role | none (CRON, idempotent by design) |
| `rate-index-recompute` | service_role | none (CRON) |
| `match-generate` | broker JWT / service_role | none (read-only) |
| `leaderboard-snapshot-hourly` | service_role | none (CRON) |
| `broker-score-recompute` | service_role | none |
| `reviews-log` | driver/broker JWT | DB unique constraint `(job_id, reviewer_id)` |
| `referrals-redeem` | driver JWT | `referral:{code}:{new_user_id}` |
| `stripe-webhook` | Stripe signature | Stripe `event.id` (native dedup) |
| `deeplink-redirect` | anon | none |
| `admin-set-setting` | admin JWT | none |

---

## 17. PENDING MIGRATIONS TO WRITE

These specs are finalized and ready to migrate:

1. **`notification_events`** — inbox table (§6)
2. **`idempotency_keys`** — dedup table (§9)
3. **RLS on `notification_events`** — (§6)

Add these as the next numbered migration file and run `npx supabase db push`.
