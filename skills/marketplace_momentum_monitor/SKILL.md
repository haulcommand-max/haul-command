---
name: marketplace-momentum-monitor
description: Monitors overall marketplace health and detects early growth or stall signals.
---

# Marketplace Momentum Monitor

## Health Metrics

1. **Active operators** — Count of operators with activity in the trailing 7/30 days
2. **Load velocity** — Rate of new loads posted per day/week, trending up or down
3. **Match success rate** — Percentage of posted loads that successfully match to an operator
4. **Time to first response** — Median time from load posting to first operator response
5. **Revenue per corridor** — Average monetization per corridor per period

## Alerts

- **Growth acceleration** — Metrics trending above baseline by >15% — surface to admin dashboard
- **Liquidity risk** — Supply-demand imbalance exceeding threshold — trigger liquidity gap finder
- **Engagement drop** — Login frequency or session depth declining >10% — trigger churn risk detector
- **Revenue anomalies** — Unexpected revenue spikes or drops — flag for investigation
