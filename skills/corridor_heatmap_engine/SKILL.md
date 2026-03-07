---
name: corridor-heatmap-engine
description: Generates real-time corridor heatmaps showing supply, demand, and surge pressure.
---

# Corridor Heatmap Engine

## Layers

1. **Demand intensity** — Load volume and broker search frequency per corridor
2. **Supply density** — Active operator count and availability per corridor
3. **Price pressure** — Rate trends relative to baseline (rising, stable, falling)
4. **Failure rate** — Percentage of loads that fail to match or complete
5. **Seasonal effects** — Historical patterns overlaid on current data

## Output

- **Heat tier** — Per-corridor classification: 🔴 Critical, 🟠 Hot, 🟡 Warm, 🟢 Balanced, 🔵 Cold
- **Opportunity zones** — Corridors where operators can earn above-average rates
- **Risk zones** — Corridors with high failure rates, complaints, or fraud signals
