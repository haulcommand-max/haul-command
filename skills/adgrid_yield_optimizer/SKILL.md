---
name: adgrid-yield-optimizer
description: Maximizes advertising revenue by dynamically adjusting placement, density, and pricing.
---

# AdGrid Yield Optimizer

## Optimization Levers

1. **Dynamic floor pricing** — Adjust minimum bid prices based on demand, fill rate, and geo tier
2. **Slot performance** — Rank and prioritize ad slots by CTR, conversion rate, and revenue per impression
3. **Corridor value** — Weight ad placement toward high-demand, high-value corridors
4. **Advertiser LTV** — Prioritize delivery for high-lifetime-value advertisers
5. **Fill rate** — Monitor and optimize fill rates across all slot types and geographies

## Actions

- **Raise/lower floors** — Dynamically adjust floor prices (max ±20% per cycle, per guardrail config)
- **Re-rank creatives** — Shuffle creative rotation weights based on performance and fatigue
- **Recommend new inventory** — Identify underutilized placements or corridors ripe for ad expansion
