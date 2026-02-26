---
name: schema_migrator
description: Merges divergent SQL schema fragments into a single, unified, RLS-protected source of truth.
---

# Schema Migrator Skill

**Purpose**: To maintain a "Single Source of Truth" for the database schema, preventing drift between migration files and the operational schema.

**Trigger**: When `supabase/migrations/` contains multiple new files that need to be consolidated, or when the user requests a "Schema Audit".

## 1. Analysis Phase
- Read `supabase/unified_schema.sql` (The Master).
- Read all files in `supabase/migrations/`.
- Identify:
    - New Tables
    - New Columns (ALTER)
    - New Types (ENUM)
    - New RLS Policies

## 2. Consolidation Phase
- **Do NOT** delete migration files (they are history).
- **Update** `unified_schema.sql` to include the new logic in the correct "Layer" order:
    1.  Extensions/Types
    2.  Spine Tables (Identity, Jurisdictions)
    3.  Feature Tables (Leads, Offers)
    4.  Logic Tables (Rules, Rates)
    5.  Logs/Analytics
    6.  RLS Policies

## 3. RLS Enforcement
- Every new table MUST have:
    - `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`
    - A "Service Role" Policy (Full Access).
    - A "User" Policy (Select/Insert own data).

## 4. Output
- Write the updated `unified_schema.sql`.
- Output a "Schema Changelog" summary.
