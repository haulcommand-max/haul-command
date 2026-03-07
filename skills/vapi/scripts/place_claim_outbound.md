# Place Claim Outbound Script — Full Call Flow

## Pre-Call Checks (automated)
1. ✅ `compliance-enforcer.checkComplianceGate(countryCode, 'call')` → must return `allowed: true`
2. ✅ `offer-sequencer.determineNextOffer(context)` → must return `shouldOffer: true`
3. ✅ Phone number validated (E.164 format, not on DNC list)
4. ✅ Entity not in cooldown period
5. ✅ Within calling hours for target timezone

## Call Flow

### Phase 1: Opening (0-15s)
```
[DISCLOSURE if recording enabled]
"This call may be recorded for quality purposes."

[IDENTIFY]
"Hi, this is [PERSONA_NAME] from Haul Command."

[QUALIFY]
"Am I speaking with someone at [BUSINESS_NAME]?"
  → If no: "Could you point me to the right person?"
  → If gatekeeper: "I'm calling about your free business listing in our trucker directory."

[PERMISSION]
"Is now a good time for a quick two-minute call?"
  → If no: "When would be better? I'll call back." → schedule callback
```

### Phase 2: Value Proposition (15-45s)
```
"We built a free listing for [BUSINESS_NAME] in our national oversize load
directory. Drivers searching for [SERVICE_TYPE] near [CITY] can already
find you. I wanted to make sure everything is accurate and give you a
chance to take control of the listing."
```

### Phase 3: Discovery (45-90s)
```
Run discovery questions from persona doc.
Capture all required fields.
```

### Phase 4: Offer (90-120s)
```
[Based on offer-sequencer decision]

IF offer_type == 'free_claim':
  "Claiming is completely free. I'll send you a link."

IF offer_type == 'verified_claim':
  "For $19 a month, you get the Verified badge — that means
   brokers see you first. Want to try it?"

IF offer_type == 'premium_placement':
  "Premium puts you at the top of search results in your area.
   It's $49 a month. Interested?"

IF offer_type == 'adgrid_boost' AND traffic_proof_met:
  "Your listing has been getting solid traffic — [X] views this week.
   An AdGrid Boost would put your brand in front of everyone searching
   your corridor. $99 a month. Want to set it up?"
```

### Phase 5: Objection Handling
```
"Too expensive" → Downsell: "How about we start with just the verified
badge at $19? You can always upgrade later."

"Not interested" → "No problem at all. Your free listing is still live.
If you change your mind, visit haulcommand.com."

"Already have enough business" → "That's great to hear. The listing is
still free and helps your online visibility. Want me to just make sure
the info is accurate?"
```

### Phase 6: Close
```
[IF accepted]
"Great. I'm sending [link/text/email] right now. You'll see a
confirmation within a minute. Any questions?"

[IF rejected]
"Understood. Your listing is at haulcommand.com/[SLUG]. Take care."

[IF opt-out requested]
"Done — I've removed you from our call list. Have a good one."
```

## Post-Call Actions (automated)
1. `recordOfferOutcome(entityId, entityType, offerType, offerTier, outcome, meta)`
2. If accepted: create claim record in `place_claims`
3. If callback scheduled: create follow-up task
4. If opted out: mark in `vapi_offer_log` + DNC list
5. Update `vapi_outbound_eligibility` score
