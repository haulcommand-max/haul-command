---
name: corridor-demand-scorer
description: Calculates demand intensity for heavy haul corridors to guide ranking, pricing, and surfacing decisions.
---

# Corridor Demand Scorer

## Scoring Factors

1. **Load frequency** — Volume of loads posted per corridor per time window
2. **Broker activity** — Number of unique brokers searching or posting in the corridor
3. **Seasonal volatility** — Historical demand fluctuations by season, month, and day-of-week
4. **Operator supply** — Count and availability of active operators covering the corridor
5. **Historical conversion** — Past match-to-completion rate for loads in the corridor

## Actions

- **Assign demand tier** — Classify corridors as Hot (A), Warm (B), Moderate (C), or Cold (D)
- **Flag surge corridors** — Identify corridors experiencing abnormal demand spikes
- **Recommend visibility boosts** — Suggest which corridors should receive priority placement, AdGrid emphasis, or operator recruiting focus
