# AdGrid Upgrade Outbound Script

## Pre-Call Checks
1. ✅ Compliance gate passes for country
2. ✅ Entity claim_status >= 'claimed_verified'
3. ✅ Traffic proof met: `page_views_7d >= 25` AND `search_impressions_28d >= 250`
4. ✅ Offer sequencer returns `adgrid_boost` or `bundle_package`
5. ✅ Not in cooldown

## Call Flow

### Opening
"Hi [NAME], this is [PERSONA] from Haul Command. Quick update on your listing — you've been getting some solid traffic. Do you have 60 seconds?"

### Data-Driven Pitch
"In the last 7 days, your listing at [BUSINESS_NAME] got [VIEWS] views from drivers and brokers searching [CORRIDOR]. That puts you in the top [PERCENTILE]% for your area."

### The Offer
"With an AdGrid Boost, your brand shows up as the featured business when anyone searches your corridor. You'd also get a highlighted badge and priority placement. It's $99 a month — and based on your traffic, you'd be looking at roughly [EST_LEADS] new contacts per month."

### Objection: Too Expensive
"I hear you. We also have a starter CPC option — you only pay when someone actually clicks through to your listing. It starts at about $2-3 per click, and you set a daily budget. Want to try that instead?"

### Objection: Need to Think About It
"Absolutely. I'll send you a one-pager with your traffic data so you can review it. If you decide to go ahead, you can activate it from your dashboard anytime."

### Objection: Already Advertise Elsewhere
"Makes sense. The difference with Haul Command is that our traffic is 100% oversize-load-specific. Every view is from someone in the industry. Where else are you advertising?"

### Close
"Great — I'll get that activated right now. You'll see it go live within the hour. Any questions?"

### Opt-Out
"No problem. I'll note that down. Your listing stays active either way."
