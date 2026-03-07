---
name: broker-intent-detector
description: Detects and scores broker hiring intent from behavior signals across the platform.
---

# Broker Intent Detector

## Signals to Evaluate

1. **Search depth** — Number of searches and filter refinements in a session
2. **Corridor specificity** — Whether searches target specific corridors vs. broad regions
3. **Repeat visits** — Return frequency to same operator profiles or corridors
4. **Time on operator pages** — Dwell time on profile pages, equipment details, and reviews
5. **Urgency keywords** — Presence of terms like "ASAP", "urgent", "today", "emergency" in searches or messages

## Output

- **Intent score** — Numeric score (0-100) representing hiring probability
- **Hot lead flag** — Boolean flag when intent score exceeds threshold (≥75)
- **Suggested follow-up timing** — Optimal window to surface operators or trigger outreach (e.g., "within 2 hours", "next morning")
