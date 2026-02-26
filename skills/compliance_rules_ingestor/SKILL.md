---
name: compliance_rules_ingestor
description: Converts scraped PDF/Text manuals into structured JSONB for the jurisdiction_rules engine.
---

# Compliance Rules Ingestor Skill

**Purpose**: To turn "dead text" (PDFs) into "live logic" (Validation Engines).

**Trigger**: When adding a new State or Province to the OS.

## 1. Input Source
- Identify the "Source of Truth" (DOT Website / PDF).
- Fetch using `public_fetch.ts` (Store Provenance).

## 2. Extraction Target (JSONB Schema)
Map the text to these keys:
- `certification_required` (Bool)
- `height_pole_trigger` (Feet/Inches)
- `police_escort_trigger` (Dimensions)
- `daylight_restrictions` (Time)
- `holiday_blackouts` (Dates)
- `equipment_requirements` (List)

## 3. Verification
- **Double Check**: Compare extracted rule against a known "Golden Record" (e.g., Oversize.io or Manual Check).
- **Provenance**: Store the Source URL and Date Checked in the `metadata` field of the DB record.

## 4. Output
- SQL `UPDATE` statement for `jurisdiction_rules`.
