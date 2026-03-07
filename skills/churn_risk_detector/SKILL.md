---
name: churn-risk-detector
description: Predicts operators or brokers at risk of going inactive and triggers retention actions.
---

# Churn Risk Detector

## Warning Signals

1. **Drop in logins** — Declining login frequency compared to trailing 30-day average
2. **Slower responses** — Increasing response time to load inquiries and messages
3. **Declining jobs** — Decrease in jobs accepted or completed over recent periods
4. **Profile decay** — Outdated information, expired insurance, stale availability status
5. **Negative feedback** — Recent complaints, disputes, or low-star reviews

## Actions

- **Risk score** — Numeric churn probability (0-100) with low/medium/high classification
- **Intervention trigger** — Automated alert to retention team when score exceeds threshold (≥70)
- **Recommended incentive** — Suggested retention action (free visibility boost, priority placement, personal outreach, rate incentive)
