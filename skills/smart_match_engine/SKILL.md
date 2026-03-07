---
name: smart-match-engine
description: Matches brokers with the most suitable escort operators based on multi-factor scoring.
---

# Smart Match Engine

## Matching Factors

1. **Corridor proximity** — Distance and alignment between operator coverage and load route
2. **Equipment compatibility** — Match between required and available equipment (pilot car, escort vehicle, signage, height poles)
3. **Availability window** — Overlap between load timing and operator availability
4. **Reputation score** — Operator trust and quality score from the reputation engine
5. **Price competitiveness** — Operator rates relative to corridor benchmarks and broker expectations

## Output

- **Ranked operator list** — Top N operators sorted by composite match score
- **Match confidence** — Percentage confidence for each match (high/medium/low)
- **Backup candidates** — Secondary operators available if primary matches decline
