# Haul Command: 120-Country Training Architecture Spec (v1)

## 1. System Posture
Haul Command's training OS is built as a **global machine** that executes **jurisdiction-specific logic**. 
It handles 120 countries through a 3-layer system:
1. **Global Engine:** The core platform (video player, transcripts, quiz handling, fleet dashboards, reminder logic, monetization, validation).
2. **Country Rule Packs:** The default rules for a country (e.g., standard USA rules, Canada rules).
3. **Local Overrides:** Subnational rules that supersede the country default (e.g., Florida).

## 2. Global Tables (Supabase Schema)

### `training_jurisdictions`
- `id` (uuid)
- `country_code` (text, ISO 3166-1 alpha-2)
- `region_code` (text, nullable, e.g., 'US-FL')
- `credential_type` (text, e.g., 'government', 'vendor', 'association', 'informal')
- `is_mandatory` (boolean)
- `official_path_url` (text, nullable)
- `validity_years` (int)
- `refresher_allowed` (boolean)
- `refresher_grace_period_days` (int)

### `training_tracks`
- `id` (uuid)
- `jurisdiction_id` (uuid, fk -> training_jurisdictions)
- `track_slug` (text)
- `title` (text)
- `track_type` (enum: 'certification', 'refresher', 'optional_skill')
- `official_course_hours_total` (numeric)
- `hc_estimated_prep_hours_total` (numeric)

### `training_modules`
- `id` (uuid)
- `track_id` (uuid, fk -> training_tracks)
- `sequence_order` (int)
- `module_slug` (text)
- `module_title` (text)
- `official_session_title` (text, nullable)
- `official_minutes` (int)
- `hc_estimated_minutes` (int)
- `video_asset_id` (text, nullable)
- `poster_image_url` (text, nullable)
- `practical_required_boolean` (boolean)
- `visible_text_ready` (boolean)
- `structured_data_ready` (boolean)
- `video_ready` (boolean)
- `search_ready` (boolean)

### `training_claim_rules`
- `id` (uuid)
- `jurisdiction_id` (uuid)
- `allowed_claims` (jsonb) 
- `forbidden_claims` (jsonb)
- `legal_review_status` (enum: 'pending', 'approved')
- `last_source_reviewed_at` (timestamptz)

### `training_reciprocity_rules`
- `id` (uuid)
- `issued_jurisdiction_id` (uuid)
- `accepted_in_jurisdiction_id` (uuid)
- `conditions` (text, nullable)

### `training_exams` & `training_badges`
- `training_exams`: Stores quiz banks, pass thresholds, question counts.
- `training_badges`: Emitted credentials, expiry dates, verification URLs.

## 3. Country Pack Schema

A JSON-compatible country pack configuration that populates the DB tables.

```json
{
  "jurisdiction": "US",
  "base_rules": {
    "credential_type": "state-by-state",
    "is_mandatory": true,
    "default_validity_years": 4
  },
  "vocabulary_aliases": {
    "escort_driver": "Pilot Car Driver",
    "warning_vehicle": "Escort Vehicle"
  },
  "allowed_claims": ["Prepares operators for certification"],
  "forbidden_claims": ["Federally certified", "DOT approved"]
}
```

## 4. Override Logic

When an operator accesses `/training/usa/florida`:
1. The route resolves `country_code = 'US'` and `region_code = 'US-FL'`.
2. The query engine requests rules for `region_code = 'US-FL'`.
3. If found, those rules override the `US` country pack rules.
4. E.g., The Florida override enforces an exact 8-hour requirement (6 hours instruction + 2 hours exam) and updates the vocabulary and claims based on FDOT requirements.
5. If the user moves to `/training/usa/texas` where no strict state-issued cert exists (assuming generic rules), it falls back to the `US` national best-practice pack.

## 5. Route Tree (Next.js)

```
/app/training
├── /page.tsx                                # Global trust hub & academy overview
├── /[country_slug]
│   ├── /page.tsx                            # Country rules & track selector
│   ├── /official-path/page.tsx              # Official sources, renewal & reciprocity
│   ├── /[region_slug]
│   │   ├── /page.tsx                        # Specific region hub (e.g., Florida)
│   │   ├── /official-path/page.tsx          # State official requirements
│   │   ├── /refresher/page.tsx              # State refresher path
│   │   └── /[module_slug]/page.tsx          # Real SEO watch pages & transcripts
├── /fleet
│   ├── /page.tsx                            # B2B compliance dashboard
│   └── /assign/page.tsx                     # Seat purchasing and assignment
├── /verify
│   └── /[credential_id]/page.tsx            # Public badge verification (Trust OS)
```

## 6. Claim Engine

- Profiles claiming a completed training receive a visible "HC Prepared" or verified badge.
- **Acquisition Path:** "Your state requires a 4-hour refresher. You have 90 days. Get Florida-ready in HC."
- **Verification Path:** Operator uploads state cert -> OCR/Human verify -> Trust score goes up -> Badge displays on directory.
- **Rule Verification Pipeline:** Any legal claim made must have `legal_review_status = 'approved'` before `visible_text_ready` can be true on a module.

## 7. Video / Transcript Contracts

### Watch Page Layout Contract
1. **Above Fold:** H1 with Jurisdiction Scope Label + Short Legal/Positioning Disclaimer.
2. **Video Player:** Custom React/Next.js wrapper around a managed backend (e.g., Cloudflare Stream).
3. **Player Capabilities:** HLS playback, timestamp jumps, VTT captions, sticky mini-player for mobile, speed control.
4. **Below Fold / On-Page Text:**
   - Bulleted Learning Objectives.
   - Server-Rendered Transcript (clean spoken + chapters as H2/H3 anchors).
   - "Plain English Takeaway" & "Rule/Workbook Tie-in" & "Field mistake to avoid".
   - Practice Quiz & Downloadable Checklist.
   - Internal Links -> glossary, tools, regulations, nearby directories.

### Metadata / SEO Contract
- Enforce `VideoObject` structured data globally.
- Enforce `Course` / course-list markup on `/training` and Hub pages.
- Transcripts *must not* be hidden behind JS or accordions; they must be crawlable plain HTML.

## 8. Monetization by Jurisdiction Tier

### Free Tier (All Jurisdictions)
- First module watch-page preview.
- Glossary, regulation links, tools.
- Downloadable compliance checklists.
- State requirement rule alerts.

### Paid Self-Serve (Prep / Refresher)
- **$29 - $49:** Full track access, mock exam, printable workbook companion.
- **$15/mo:** Renewal reminder automation + continuous updates.

### B2B Fleet Tier (Enterprise)
- **$149+/mo (+ Seat Fees):** Fleet training dashboard.
- Assign seats, require module completion, auto-export DQF compliance logs.

### Value-Add Marketplace Monetization
- "Trained on Haul Command" profile trust boost (leads to more broker jobs).
- Market-specific filtering logic charging brokers to query fully-certified-only operators in strict states (Florida, New York, Washington).
- Sponsor Slots: Targeted ads for CDL schools, upfitters, and insurance against the state hubs.
