# Broker Intake Inbound Script

## Trigger
Incoming call to a Haul Command directory number or "Call for Escort" button click.

## Call Flow

### Greeting (auto-detected from caller ID or listing context)
"Haul Command, this is [PERSONA]. How can I help you?"

### Intent Detection
Listen for:
- "I need an escort / pilot car" → **Load Intake Flow**
- "I want to list my company" → **Redirect to Claim Flow**
- "I have a question about my account" → **Account Support**
- "What do you charge?" → **Pricing Info**

### Load Intake Flow
```
"I can help you find an escort. Let me grab a few details."

1. "Where's the pickup? City and state."
2. "And the delivery location?"
3. "What are the load dimensions? Width, height, and length."
4. "How about the weight?"
5. "When do you need the escort?"
6. "Lead car, chase car, or both?"
7. "Do you already have your permits?"
```

### Match Response
"I'm checking availability now..."
[Query: `getTopEscortsForBroker(corridorSlug, requiredCount)`]

"I found [N] verified escorts covering that corridor. The top-rated one is [OPERATOR_NAME] with a [TRUST_TIER] trust score. Want me to connect you, or should I text you the top 3?"

### Pricing Question
"Escort rates vary by corridor and load size. For a [CORRIDOR] move, you're typically looking at $[RANGE] per escort per day. Want me to get you exact quotes from available operators?"

### No Match Available
"I don't have anyone available on that exact corridor right now, but I can:
1. Put out an alert to operators in nearby areas
2. Check our waitlist for upcoming availability
3. Send you alternatives covering part of the route
Which works best?"

### Close
"Alright, I've sent [matches/alert/info] to your phone at [NUMBER]. Anything else I can help with?"

## Post-Call Actions
1. Log call to `lead_events` (event_type: 'phone_call')
2. Create lead record with load details
3. If match made: create `match_offer` record
4. Update corridor `open_loads` count
5. Attribute to ad impression if applicable
