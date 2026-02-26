---
name: marketplace_match_engine
description: Defines the logic for the "Velocity Engine" (Top 3 Explainable Matches).
---

# Marketplace Match Engine Skill

**Purpose**: To instantly identify the "Best Fit" drivers for a load, optimizing for speed and reliability, not just price.

**Trigger**: When `MatchEngine.ts` is updated or criteria changes.

## 1. The Formula (Velocity Score)
`Match Score = (Proximity * 0.4) + (Experience * 0.3) + (Reputation * 0.3)`

- **Proximity**: `1 / (Deadhead Miles + 1)`
- **Experience**: `Log(Role Trips + 1)`
- **Reputation**: `(OnTime % + HireAgain %) / 2`

## 2. The Hard Gates (Binary Filters)
Before Scoring, apply these filters:
- **Compliance**: Does Driver Cert cover Route? (Reciprocity Engine).
- **Equipment**: Does Driver have High Pole (if required)?
- **Insurance**: Is COI Valid?

## 3. Explainability
- The output MUST explain *why* a driver was matched.
- Example: "Rank 1: 15 miles away, 100% Compliant, 50 High Pole Trips."

## 4. Fairness
- New Drivers get a "Rookie Boost" (Artificial Reputation) for their first 5 bids to prove themselves.
