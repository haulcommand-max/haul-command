# Social Loop & Gamification Design
# Skill #4 — leaderboards are the activation point; wire engagement loops
#
# STATUS: Leaderboard UI exists (Vanguard/Centurion/Sentinel tiers, podium design)
# but is running on MOCK_LEADERS static data.
# This document wires the live DB connection and defines
# the full gamification loop: streaks, badges, corridor ranks, seasonal scores.
# ════════════════════════════════════════════════════════════

## Critical Fix First: Replace MOCK_LEADERS with Live DB

The leaderboard page is live in production but currently renders **static fake data**.
This is the highest-priority fix before any gamification work.

### DB Query (replace MOCK_LEADERS)

```typescript
// lib/leaderboards/getLeaders.ts
import { createServerClient } from '@/lib/supabase/server';

export async function getLeaders(scope: 'national' | 'state' | 'corridor' = 'national', filter?: string) {
  const supabase = createServerClient();

  let query = supabase
    .from('v_leaderboard_public')  // or operators table ordered by hc_index_score
    .select(`
      id,
      company_name,
      hc_tier,
      hc_index_score,
      verified_runs,
      rating_avg,
      avg_response_min,
      location_city,
      location_state,
      location_country,
      active_corridors,
      fmcsa_status
    `)
    .order('hc_index_score', { ascending: false })
    .limit(25);

  if (scope === 'state' && filter) {
    query = query.eq('location_state', filter);
  }

  if (scope === 'corridor' && filter) {
    query = query.contains('active_corridors', [filter]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
```

### Page Migration (server component)

```typescript
// app/leaderboards/page.tsx — convert to server component
// Remove MOCK_LEADERS and 'use client'
// Add: export const revalidate = 300; // revalidate every 5 min

import { getLeaders } from '@/lib/leaderboards/getLeaders';

export const revalidate = 300;

export default async function LeaderboardsPage() {
  const leaders = await getLeaders('national');
  // ... rest of render using leaders instead of MOCK_LEADERS
}
```

---

## Gamification Loop Architecture

### HC Index Score Formula
(Already defined in `ADGRID_FORMULA_SPECS.yaml` — operator_trust_formula)

```
hc_index_score =
  (verification_level * 0.25) +
  (behavior_score * 0.35) +       ← runs completed, on-time rate, response speed
  (social_proof * 0.25) +         ← rating avg × review count weight
  (corridor_expertise * 0.15) -   ← depth on specific corridors
  (dispute_penalty)

Range: 0–100. Displayed as "HC Index: 99.8"
```

---

## Tier System

| Tier | Icon | HC Index | Perks |
|---|---|---|---|
| **Vanguard** | 🏆 | 95–100 | Gold badge, #1-placement, corridor sponsor eligible |
| **Centurion** | 🥈 | 80–94 | Silver badge, boosted directory rank |
| **Sentinel** | 🥉 | 60–79 | Bronze badge, standard boost |
| **Operator** | — | < 60 | Base listing |

Tier cutoffs recalculate **at end of each 90-day season**.

---

## Season System

```yaml
season:
  length_days: 90
  reset: rolling         # New season starts when old one ends
  warning_at_days: 7     # "Season ends in 7 days" notification

score_decay:
  enabled: true
  inactive_days_before_decay: 60
  decay_rate_per_day: 0.02
  floor: 0.70            # Score can't fall below 70% of peak

promotion_ceremony:
  trigger: tier_change_at_season_end
  notification: email + in-app
  message: "You've been promoted to Centurion! Your new badge is live."
```

---

## Streak Mechanics

```yaml
streak_types:

  active_streak:
    label: "Active Streak"
    description: "Consecutive days with at least 1 job completed or profile updated"
    milestones: [7, 30, 90, 180, 365]
    rewards:
      7:   "Streak badge on profile"
      30:  "+5% HC Index bonus for the week"
      90:  "Centurion fast-track eligible"
      180: "Featured in Haul Command newsletter"
      365: "Lifetime Veteran badge"

  response_streak:
    label: "Fast Responder"
    description: "5+ consecutive contact requests answered within 15 min"
    badge: "⚡ Fast Responder"
    hc_index_bonus: 2.0

  corridor_streak:
    label: "Corridor Dominator"
    description: "10+ runs on the same corridor in 30 days"
    badge: "🛣 [Corridor] Specialist"
    perk: "Corridor sponsor badge eligibility unlocked"
```

---

## Badge Catalog

| Badge | Trigger | Display |
|---|---|---|
| `✓ Verified` | FMCSA + DOT confirmed | Profile + card |
| `⚡ Fast Responder` | 5+ responses < 15 min | Profile |
| `🛣 I-10 Specialist` | 10+ I-10 runs in 30d | Card (top corridor) |
| `🏆 Vanguard` | HC Index 95+ | Leaderboard + profile + card |
| `🔥 On a Streak` | 30-day active streak | Profile |
| `🌍 Global Operator` | Active in 3+ countries | Profile |
| `💎 Veteran` | 365-day active streak | Profile (permanent) |
| `📋 100 Runs` | 100 verified completions | Profile milestone |
| `📋 1K Runs` | 1,000 verified completions | Profile featured |
| `🥇 Season Champion` | #1 national at season end | Profile (seasonal) |

---

## Engagement Loops

### Loop 1: Score Visibility Loop
```
Operator checks HC Index score
  → sees gap to next tier
  → completes another job / updates profile
  → score increases
  → repeat

Activation: "You're 3.2 points from Centurion. Complete 2 more runs."
Surface: Operator dashboard, email digest
```

### Loop 2: Corridor Dominance Loop
```
Operator sees corridor ranking ("You're #4 on I-10")
  → wants to be #1
  → accepts more I-10 loads
  → gains Corridor Specialist badge
  → badge surfaces on corridor search page
  → more I-10 buyers find and prefer them
  → repeat

Activation: "3 operators are ahead of you on I-10 this season."
```

### Loop 3: Social Sharing Loop
```
New badge earned (e.g., "1,000 Runs" milestone)
  → platform generates shareable card with badge + stats
  → operator shares to Facebook/LinkedIn
  → clicks drive traffic back to their Haul Command profile
  → new buyers find them via shared link
```

### Loop 4: Seasonal Competition Loop
```
7 days before season end:
  → "Season ends in 7 days. You're #12 nationally."
  → operators push hard for last-week jobs
  → platform sees activity spike
  → season ends, new badges/tiers announced
  → email blast to all operators with their final rank
```

---

## Leaderboard Scope Tabs (UI wire)

Add tabs to existing leaderboard page:

```
[National] [By State ▾] [By Corridor ▾] [This Season]
```

State filter → dropdown (50 states + countries)
Corridor filter → top corridors list from corridor data

---

## Notifications (wire to /api/comms)

```yaml
notification_triggers:
  - event: tier_promotion
    channel: [email, in_app]
    message: "You've been promoted to {new_tier}!"

  - event: rank_change
    channel: [in_app]
    frequency: weekly_digest
    message: "Your national rank this week: #{rank}"

  - event: streak_milestone
    channel: [email, in_app]
    message: "You've hit a {streak_days}-day active streak! Here's your badge."

  - event: season_ending
    channel: [email]
    days_before: 7
    message: "Season ends in 7 days. You're #{rank}. Make your move."

  - event: corridor_rank_change
    channel: [in_app]
    message: "{operator} overtook you on {corridor}. You're now #{rank}."
```

---

## DB Schema Additions

```sql
-- Seasons
CREATE TABLE hc_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- 'Q1 2026'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Season scores (snapshot per operator per season)
CREATE TABLE hc_season_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES hc_seasons(id),
  operator_id UUID REFERENCES operators(id),
  final_score NUMERIC(6,2),
  final_rank_national INTEGER,
  final_rank_state INTEGER,
  final_tier VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges
CREATE TABLE operator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES operators(id),
  badge_slug VARCHAR(60) NOT NULL,
  badge_label TEXT,
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  season_id UUID REFERENCES hc_seasons(id)  -- null = permanent
);

-- Streaks
CREATE TABLE operator_streaks (
  operator_id UUID REFERENCES operators(id) PRIMARY KEY,
  active_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  response_streak_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Order

```
1. [ ] Replace MOCK_LEADERS with live DB query (lib/leaderboards/getLeaders.ts)
2. [ ] Convert leaderboard page to server component with revalidate = 300
3. [ ] Add National / State / Corridor tabs to leaderboard UI
4. [ ] Create migration: hc_seasons, hc_season_scores, operator_badges, operator_streaks
5. [ ] Build badge-award function (trigger on job completion, streak hit)
6. [ ] Add "Where do you rank?" CTA for operators (links to /dashboard/rank)
7. [ ] Wire season notifications to /api/comms
8. [ ] Build shareable badge card (PNG generation or OG image route)
```
