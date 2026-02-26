---
name: seo_programmatic_generator
description: Generates thousands of "Intent Ladder" landing pages from the jurisdiction_rules database.
---

# SEO Programmatic Generator Skill

**Purpose**: To capture "Long Tail" search traffic by converting database rows into unique, high-value HTML pages.

**Trigger**: When `seo_generator.py` needs an update or when we need to target a new "Tier" (e.g. City Pages).

## 1. Data Source
- **Primary**: `jurisdiction_rules` (Regulations).
- **Secondary**: `providers` (Aggregation counts).
- **Tertiary**: `hazards` (Risk data).

## 2. Page Templates (Next.js)
- **Tier 1 (State)**: `/pilot-car-services/[state]`.
    - Focus: Compliance Rules, Reciprocity map.
    - Schema: `FAQPage`.
- **Tier 2 (City)**: `/pilot-car/[city]-[state]`.
    - Focus: "Available Now", "High Pole".
    - Schema: `LocalBusiness` (Aggregate).
- **Tier 3 (Corridor)**: `/escort-for/[corridor]`.
    - Focus: Wind/Height Risks.

## 3. Automation Logic
- Script must iterate through all valid permeations.
- Must inject `JSON-LD` Schema markup dynamically.
- Must link mainly to **Hub Pages** and **Micro-Tools**.

## 4. Internal Linking Strategy
- Every generated page must have:
    - 1 link to State Parent.
    - 3 links to Related Cities.
    - 1 link to a "Micro-Tool" (Calculator).
