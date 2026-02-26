# Facebook Profit Control (Monetization Engine)

This document outlines the systematic conversion of Facebook group interactions into a profit center for Haul Command.

## 1. Monetization Strategy

### Direct Affiliate Routing
- **n8n Workflow**: `fb_keyword_monitor`
- **Logic**: 
    - Monitor group posts for keywords: "escort", "permit", "insurance", "TWIC", "WITPAC".
    - AI Sentiment Node checks if the user is looking for a recommendation.
    - Auto-respond with specific Compliance Partner affiliate links.
- **Revenue**: $50–$250 per referral conversion.

### Community-Led SKU Creation (Voting to SKU)
- **Concept**: Use group engagement as a product filter.
- **Process**:
    - If a product suggestion post gets >50 likes/comments, trigger n8n alert.
    - Draft SKU added to Supabase `store_products` table as "COMING SOON".
    - Pre-orders enabled via Haul Pay to fund production/bulk-buy.

### Newsletter & Fulfillment Funnel
- **New Member Onboarding**:
    - Auto-DM new members with a "Free Compliance Checklist".
    - Capture email/phone → GHL Onboarding sequence.
    - Route to Haul Command Fulfillment Rail for Starter/Pro kits.

## 2. Technical Implementation

- **Trigger**: Facebook Groups API (or Web Scraper if API restricted).
- **Processing**: n8n with Gemini 2.0 Flash for classification.
- **Storage**: Interaction history in Supabase for reputation scoring.

## 3. The Two-Layer Social Funnel (Discovery vs. Engagement)

To solve the "Locked Garden" problem where Google cannot crawl Facebook Groups, we deploy a dual-asset strategy.

| Asset | Platform Purpose | Google Status | Outcome |
|---|---|---|---|
| **FB Page** | SEO Discovery + Funnel Start | **CRAWLABLE** | Ranks for "Haul Command" on Google. |
| **FB Group** | Community Engagment + Marketplace | **PRIVATE** | High-intensity "Lock-In" and loyalty. |

### The "Loop" Workflow:
1.  **SEO Discovery**: High-authority posts on the **FB Page** rank on Google.
2.  **Inbound Funnel**: Page posts link directly to the **FB Group** (The Powerhouse).
3.  **Entity Stacking**: The Page is linked in the "Entity Stack" (Pinterest/Reddit/Medium) to boost its PageRank.

---
**Status**: ACTIVE
**Goal**: Discovery on Google ➡️ Dominance on Facebook.
