---
name: operator-reputation-engine
description: Computes and updates operator reputation momentum across the marketplace.
---

# Operator Reputation Engine

## Inputs

1. **Reviews velocity** — Rate and recency of new reviews received
2. **Response time** — Average time to respond to broker inquiries and load offers
3. **Job completion rate** — Percentage of accepted jobs successfully completed
4. **Complaint signals** — Disputes, negative reviews, and escalation events
5. **Repeat broker usage** — How often the same brokers re-hire the operator

## Output

- **Reputation score** — Composite numeric score (0-100) reflecting overall operator quality
- **Momentum trend** — Rising, stable, or declining trajectory over trailing 30/60/90 days
- **Risk flags** — Indicators of potential fraud, gaming, or quality deterioration
