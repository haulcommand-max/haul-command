---
name: operator-availability-predictor
description: Predicts near-term operator availability using behavioral and historical patterns.
---

# Operator Availability Predictor

## Signals

1. **Recent activity** — Last login, last job completed, last status update
2. **Historical patterns** — Day-of-week and time-of-day availability trends
3. **Region demand** — Current load density in the operator's primary corridors
4. **Calendar density** — Number of upcoming committed jobs on the operator's schedule
5. **Response latency** — Recent response time trends (faster = more likely available)

## Actions

- **Predict availability window** — Estimate the next period when the operator is likely free (e.g., "available tomorrow 8am–4pm")
- **Pre-surface operators** — Proactively show predicted-available operators to brokers before they search
- **Alert brokers** — Notify brokers when a preferred operator becomes available in their corridor
