/**
 * Listmonk Email Campaign Templates for Activation
 * 
 * These templates are designed to convert the 2,875 existing operator
 * listings into active, claimed profiles on Haul Command.
 * 
 * Campaign Categories:
 * 1. "You're Already Listed" — Ownership psychology
 * 2. Profile Completion Meter — Progress triggers
 * 3. Phantom Demand Alerts — FOMO/opportunity cost
 * 4. Territory Ownership — Scarcity claims
 * 5. Weekly Corridor Intelligence — Market intelligence
 * 6. Review Harvest — Post-job review collection
 * 7. Reputation Report — Monthly stats gamification
 */

export const LISTMONK_CAMPAIGNS = {
    // ── Campaign 1: You're Already Listed ──────────────────────────
    youre_already_listed: {
        name: "Activation: You're Already Listed",
        subject: "Your escort listing is already live on Haul Command",
        segment: "unclaimed_listing",
        trigger: "contact_exists AND claim_status != 'claimed'",
        template: `
Hi {{.Subscriber.Name}},

Your escort service is already listed on **Haul Command** — the largest pilot car network covering 52 countries.

**What's live right now:**
- ✅ Company name: {{.Subscriber.Attribs.company_name}}
- ✅ Coverage: {{.Subscriber.Attribs.city}}, {{.Subscriber.Attribs.region_code}}
- ✅ Services detected
- ✅ Equipment tags assigned

**What's hidden until you claim:**
- 📞 Your phone number (masked)
- 📧 Your email (hidden)
- 📍 Exact location (city only)

Brokers are searching for escorts in your area right now.

**[Claim Your Listing →]({{.Subscriber.Attribs.claim_url}})**

Claiming takes 60 seconds and unlocks load alerts, booking requests, and priority placement.

— Haul Command
    `,
    },

    // ── Campaign 2: Profile Completion Meter ──────────────────────
    profile_completion: {
        name: "Activation: Complete Your Profile",
        subject: "Your Haul Command profile is {{.Subscriber.Attribs.completion_pct}}% complete",
        segment: "claimed_incomplete",
        trigger: "claim_status = 'claimed' AND profile_completeness < 80",
        template: `
Hi {{.Subscriber.Name}},

Your profile is **{{.Subscriber.Attribs.completion_pct}}% complete**.

**Missing items:**
{{if not .Subscriber.Attribs.has_equipment}} - ⚠️ Equipment not added{{end}}
{{if not .Subscriber.Attribs.has_availability}} - ⚠️ Availability not set{{end}}
{{if not .Subscriber.Attribs.has_photo}} - ⚠️ Profile photo missing{{end}}
{{if not .Subscriber.Attribs.has_rate}} - ⚠️ Rate not configured{{end}}

Profiles above 80% get **3× more load offers** than incomplete ones.

**[Complete Your Profile →](https://haulcommand.com/operator)**

— Haul Command
    `,
    },

    // ── Campaign 3: Phantom Demand Alert ──────────────────────────
    phantom_demand_alert: {
        name: "Demand: Loads In Your Area",
        subject: "{{.Subscriber.Attribs.load_count}} oversize loads passed through your area last week",
        segment: "all_operators",
        trigger: "weekly OR phantom_demand_signal_in_area",
        template: `
Hi {{.Subscriber.Name}},

**{{.Subscriber.Attribs.load_count}} oversize loads** passed through your area last week.

**Active corridors near you:**
{{range .Subscriber.Attribs.corridors}}
- 🛣️ {{.name}} — {{.load_count}} loads, avg \${{.avg_rate }}/mi
{{end}}

**Operators needed: {{.Subscriber.Attribs.operators_needed}}**

{{if eq .Subscriber.Attribs.claim_status "unclaimed"}}
**[Claim Your Listing →]({{.Subscriber.Attribs.claim_url}})** to receive these loads.
{{else}}
**[Toggle Available →](https://haulcommand.com/operator)** to start receiving offers.
{{end}}

— Haul Command Market Intelligence
    `,
    },

    // ── Campaign 4: Territory Ownership ───────────────────────────
    territory_ownership: {
        name: "Scarcity: Your Territory",
        subject: "You're the only escort listed near {{.Subscriber.Attribs.territory}}",
        segment: "territory_sole_operator",
        trigger: "operator_count_in_territory <= 2",
        template: `
Hi {{.Subscriber.Name}},

You are **the only escort** listed near:

{{range .Subscriber.Attribs.counties}}
- 📍 {{.name}} County
{{end}}

Every broker searching these areas sees your listing first.

**Claim your territory before another operator does.**

**[Claim Territory →]({{.Subscriber.Attribs.claim_url}})**

— Haul Command
    `,
    },

    // ── Campaign 5: Weekly Corridor Intelligence ──────────────────
    weekly_corridor_intel: {
        name: "Intel: Weekly Market Update",
        subject: "Haul Command Market Update — Week of {{.Subscriber.Attribs.week}}",
        segment: "all_active_operators",
        trigger: "weekly_monday",
        template: `
Hi {{.Subscriber.Name}},

**HAUL COMMAND MARKET UPDATE**

🔥 **HOT CORRIDORS**
{{range .Subscriber.Attribs.hot_corridors}}
- {{.name}} — {{.load_count}} loads, avg **\${{.avg_rate }}/mi**
{{end}}

📊 **YOUR AREA**
- Loads this week: {{.Subscriber.Attribs.area_loads}}
- Average escort rate: \${{.Subscriber.Attribs.area_rate }}/mi
- Operators online: {{.Subscriber.Attribs.area_operators}}

{{if .Subscriber.Attribs.position}}
🏆 **Your leaderboard position: #{{.Subscriber.Attribs.position}}**
{{end}}

**[Open Dashboard →](https://haulcommand.com/operator)**

— Haul Command Intelligence
    `,
    },

    // ── Campaign 6: Review Harvest ────────────────────────────────
    review_harvest: {
        name: "Trust: Review Request",
        subject: "How did the escort go?",
        segment: "booking_completed",
        trigger: "booking_status = 'completed' AND review_not_submitted",
        template: `
Hi {{.Subscriber.Name}},

Your recent job is complete!

**Job:** {{.Subscriber.Attribs.origin}} → {{.Subscriber.Attribs.destination}}
**Date:** {{.Subscriber.Attribs.completion_date}}

⭐ **How was it?**

**[Leave a Quick Review →](https://haulcommand.com/review/{{.Subscriber.Attribs.booking_id}})**

Reviews help the community and boost your reputation score.

— Haul Command
    `,
    },

    // ── Campaign 7: Monthly Reputation Report ─────────────────────
    reputation_report: {
        name: "Gamification: Monthly Stats",
        subject: "Your Haul Command Stats — {{.Subscriber.Attribs.month}}",
        segment: "active_claimed_operators",
        trigger: "monthly_first_day",
        template: `
Hi {{.Subscriber.Name}},

**YOUR HAUL COMMAND STATS**

📊 **This Month**
- Jobs completed: **{{.Subscriber.Attribs.jobs_completed}}**
- Broker rating: **{{.Subscriber.Attribs.rating_avg}}** ⭐
- Trust score: **{{.Subscriber.Attribs.trust_score}}**
- Leaderboard: **#{{.Subscriber.Attribs.leaderboard_position}}**

{{if gt .Subscriber.Attribs.jobs_completed 5}}
🔥 You're in the **top 10%** of operators this month!
{{end}}

**[View Full Dashboard →](https://haulcommand.com/operator)**

— Haul Command
    `,
    },
} as const;

// ── SQL Segments for Listmonk ────────────────────────────────────
export const LISTMONK_SEGMENTS = {
    unclaimed_listing: `
    SELECT p.provider_key AS id, COALESCE(p.name_raw, '') AS name, 
           COALESCE(pc.email, '') AS email,
           jsonb_build_object(
             'company_name', p.name_raw,
             'city', p.city,
             'region_code', p.state,
             'claim_url', 'https://haulcommand.com/claim/' || p.provider_key,
             'claim_status', COALESCE(dl.claim_status, 'unclaimed')
           ) AS attribs
    FROM providers p
    LEFT JOIN provider_contacts pc ON pc.provider_key = p.provider_key AND pc.is_primary = true
    LEFT JOIN directory_listings dl ON dl.entity_id = p.provider_key
    WHERE pc.email IS NOT NULL 
      AND pc.email != ''
      AND (dl.claim_status IS NULL OR dl.claim_status = 'unclaimed')
  `,

    claimed_incomplete: `
    SELECT p.provider_key AS id, COALESCE(p.name_raw, '') AS name,
           COALESCE(pc.email, '') AS email,
           jsonb_build_object(
             'completion_pct', COALESCE(dl.profile_completeness, 0),
             'has_equipment', (p.category_raw IS NOT NULL),
             'has_availability', (ep.availability_status IS NOT NULL AND ep.availability_status = 'available'),
             'has_photo', false,
             'has_rate', false
           ) AS attribs
    FROM providers p
    LEFT JOIN provider_contacts pc ON pc.provider_key = p.provider_key AND pc.is_primary = true
    LEFT JOIN directory_listings dl ON dl.entity_id = p.provider_key
    LEFT JOIN escort_profiles ep ON ep.display_name = dl.name
    WHERE dl.claim_status = 'claimed'
      AND COALESCE(dl.profile_completeness, 0) < 80
      AND pc.email IS NOT NULL AND pc.email != ''
  `,
} as const;
