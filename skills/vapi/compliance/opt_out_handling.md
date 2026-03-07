# Opt-Out Handling — Vapi Voice Compliance

## Trigger Phrases (detect any of these)
- "Don't call me again"
- "Remove me from your list"
- "Stop calling"
- "Take me off your list"
- "Unsubscribe"
- "I don't want any calls"
- "Put me on your do not call list"
- "No more calls"
- "Opt out"

## Immediate Response
```
"Understood. I've removed you from our call list effective immediately.
You will not receive any more calls from Haul Command.
Is there anything else before I go?"
```

## Automated Actions (post-detection)
1. **Set opt-out flag**: `vapi_offer_log.outcome = 'opt_out'`
2. **Add to DNC list**: Insert into `outbound_dnc_list(phone, entity_id, opted_out_at)`
3. **Set max cooldown**: `cooldown_until = '2099-12-31'` (permanent)
4. **Suppress future scoring**: `vapi_outbound_eligibility` score → 0
5. **Log compliance event**: `compliance_events(type: 'opt_out', country, timestamp)`
6. **Confirm via SMS** (if sms_allowed for country):
   ```
   "You've been removed from Haul Command calls. 
    Your free listing at haulcommand.com is unaffected. 
    Reply HELP for questions."
   ```

## Edge Cases

### "Remove my listing too"
```
"I can flag your listing for removal review. Note that your business 
information is from public sources, so it may reappear from other 
directories. Would you still like me to proceed?"
```
- If yes: flag `places.status = 'removal_requested'`

### "Can I opt back in later?"
```
"Absolutely. You can reclaim your listing at haulcommand.com anytime, 
and we'll resume contact only if you initiate it."
```

### Partial opt-out: "Don't call, but you can email"
```
"Got it — no calls, but email is OK. I'll update that preference now."
```
- Set: `opt_out_channel = 'call'`, keep email active

### Hostile opt-out (yelling, threats)
```
"I understand, and I sincerely apologize for the inconvenience. 
I'm removing you right now. Have a good day."
```
- End call immediately
- Flag for compliance review: `compliance_events(type: 'hostile_opt_out')`

## Testing Requirements
Before any country's outbound is unlocked, this flow must be tested:
- [ ] Trigger phrase detection works for all variants
- [ ] DNC list update confirmed in database
- [ ] Future scoring returns 0 for opted-out entity
- [ ] SMS confirmation sends (where applicable)
- [ ] Partial opt-out correctly preserves other channels
- [ ] Test with non-English trigger phrases for non-English markets
