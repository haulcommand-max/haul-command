---
name: surge-pricing-advisor
description: Recommends dynamic pricing adjustments based on corridor pressure and liquidity.
---

# Surge Pricing Advisor

## Inputs

1. **Demand spikes** — Sudden increase in load postings or broker searches for a corridor
2. **Supply shortage** — Drop in available operators relative to active loads
3. **Time sensitivity** — Urgency of loads (same-day, next-day, scheduled)
4. **Corridor history** — Historical pricing patterns and seasonal benchmarks
5. **Broker urgency** — Behavioral signals indicating willingness to pay premium rates

## Output

- **Suggested price band** — Recommended min/max rate range for the corridor and timeframe
- **Surge flag** — Boolean indicator and surge multiplier (e.g., 1.3x, 1.6x, 2.0x max)
- **Confidence level** — How reliable the recommendation is based on data sufficiency
