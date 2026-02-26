# Core 30 SEO: Search Engine Saturation Strategy

This document outlines the 30 high-authority landing pages designed to capture every search intent in the heavy-haul ecosystem.

## 1. Core Categories (The Top 30)

### 1-10: State-Level Permitting (The High Volume)
- Oversize Permits in **Texas** (TXDOT Automation)
- Oversize Permits in **Georgia** (GDOT Automation)
- Oversize Permits in **Louisiana** (DOTD Automation)
- ... (Top 10 Heavy Haul States)

### 11-20: Gear & Equipment (The Store Funnel)
- Best Pilot Car High Poles for **Superloads**
- DOT-Compliant Oversize Load Signs & Flags
- ECCO Strobe Light Comparison for **Pilot Cars**
- ... (Top 10 Gear Categories)

### 21-30: Identity & Compliance (The SaaS Funnel)
- How to get **WITPAC** Certified fast
- **TWIC Card** renewal for heavy-haul drivers
- Fast Factoring for **Oversize Carriers**
- ... (Top 10 Compliance friction points)

## 2. Page Architecture
- **Header**: Dynamic H1 (City/State targeted).
- **Trust Signal**: "As seen in Haul Command verified network".
- **Call to Action**: "Get Instant Quote" or "Buy Gear Bundle".
- **SEO Hook**: Embedded state-specific tip (from `state_spec_tips.md`).

## 3. Automation Node (n8n)
- **Trigger**: New GSC keyword discovery.
- **Action**: Use Gemini to draft landing page copy based on `docs/` knowledge -> Push to GHL Sites API.

---
**Status**: PLANNING
**Rail**: Visibility / Visibility
