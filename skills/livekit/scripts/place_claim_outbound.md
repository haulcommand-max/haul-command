# Place Claim Outbound Script — Full Call Flow (LiveKit)

> **Migrated From**: `skills/vapi/scripts/place_claim_outbound.md`
> **Engine**: LiveKit Agents (STT: Deepgram → LLM: Gemini 2.5 Pro → TTS: ElevenLabs)
> **Agent Codename**: HC Callsign — Outbound

## Pre-Call Checks (automated)
1. ✅ `compliance-enforcer.checkComplianceGate(countryCode, 'call')` → must return `allowed: true`
2. ✅ `offer-sequencer.determineNextOffer(context)` → must return `shouldOffer: true`
3. ✅ Phone number validated (E.164 format, not on DNC list)
4. ✅ Entity not in cooldown period
5. ✅ Within calling hours for target timezone
6. ✅ Country-specific disclosure loaded
7. ✅ Language auto-detected from country_code → correct ElevenLabs voice loaded

## Call Flow

### Phase 1: Opening (0-15s)
```
[DISCLOSURE — loaded from skills/livekit/compliance/disclosures_by_country.md]
[Language selected based on country_code]

[IDENTIFY]
"Hi, this is [PERSONA_NAME] from Haul Command."

[QUALIFY]
"Am I speaking with someone at [BUSINESS_NAME]?"
  → If no: "Could you point me to the right person?"
  → If gatekeeper: "I'm calling about your free business listing in our global logistics directory."

[PERMISSION]
"Is now a good time for a quick two-minute call?"
  → If no: "When would be better? I'll call back." → schedule callback
```

### Phase 2: Value Proposition (15-45s)
```
"We built a free listing for [BUSINESS_NAME] in our global oversize load
directory — serving operators across 57 countries. Drivers searching for
[SERVICE_TYPE] near [CITY] can already find you. I wanted to make sure
everything is accurate and give you a chance to take control of the listing."
```

### Phase 3: Discovery (45-90s)
```
Run discovery questions from persona doc.
Capture all required fields including country_code.
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
Load objections from skills/livekit/objections/place_owner_objections.md
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
4. If opted out: mark in `livekit_offer_log` + DNC list
5. Update `livekit_outbound_eligibility` score
6. If claimed: trigger SEO regeneration of profile page
7. Log to `livekit_call_ledger` with full transcript
