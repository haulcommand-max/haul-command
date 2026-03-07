---
name: liquidity-gap-finder
description: Identifies supply-demand imbalances in regions, corridors, or equipment classes.
---

# Liquidity Gap Finder

## Detection Model

1. **Active loads vs operators** — Ratio of open loads to available operators in each corridor/region
2. **Response latency** — Average time for operators to respond to load inquiries (rising latency = thinning supply)
3. **Coverage holes** — Geographic areas or equipment classes with zero or near-zero operator presence
4. **Failed matches** — Loads that expired without being matched to an operator
5. **Price spikes** — Abnormal rate increases indicating supply scarcity

## Actions

- **Flag shortage zones** — Highlight regions/corridors where demand outstrips supply
- **Recommend operator recruiting** — Identify which equipment types and regions need targeted operator acquisition
- **Trigger AdGrid boosts** — Automatically increase ad visibility in shortage zones to attract operators and fill gaps
