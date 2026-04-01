# Gemini compute offload matrix

As Haul Command scales into 120 jurisdictions, maintaining velocity means reserving high-compute reasoning (Claude Opus) for structural logic (payments, data routing, live tracking websockets) and delegating repetitive generation and maintenance to Gemini 3.1 Pro.

## Tasks Assigned to Gemini 3.1 Pro 🤖
These tasks are isolated, repetitive, or require immense brute-force token generation vs. architectural reasoning.

1. **SQL Migration Schema Drift Rectification**
   * **The Problem:** The live Supabase schema in `public` contains hundreds of tables, but the 113 unapplied migrations in `supabase/migrations/` are failing due to missing base columns (like `display_name` merging issues or `broker_id` constraints).
   * **Gemini's Job:** Diff the live `information_schema.columns` against the older `2026xxxx` `.sql` patches and clean out/write bypasses for legacy SQL statements that are trying to mutate tables that have already shifted.

2. **Directory SEO State Page Generation**
   * **The Problem:** We have the dynamic routes up to `/directory/[country]/[state]`, but we need hyper-local, long-tail content generation for 1,200+ counties/metros to dominate the "Pilot car in [X]" keyword space.
   * **Gemini's Job:** Loop through the TSAS ingestion pipeline records and programmatically compile the `metadata` and markdown blobs for 50 State guides describing specific axle-weight exemptions and frost laws.

3. **Jest Testing Suite Migration**
   * **The Problem:** Existing tests are fragmented.
   * **Gemini's Job:** Port all `__tests__` directories over to mobile-first Appium/Jest setups checking offline functionality of Capacitor UI components.

## Tasks Reserved for Claude 🧠
These are mission-critical, high-friction, "Never Downgrade" tasks that directly touch revenue, compliance, and user conversion.

1. **Defense Dashboard & Data Poisoning API:** Real-time web socket plotters (`app/dashboard/defense`) analyzing `request_log` and dynamically blurring non-authenticated PII in `<DirectorySearchList />`.
2. **Stripe & Crypto Escrow Engine:** Implementing the `capture_method: 'manual'` Stripe holds and T+3 NOWPayments crypto settlement flows across the Broker dashboard without allowing instant credit card drains.
3. **Cross-Border Reciprocity Matrix:** Building the "Command Center" UI to instantly verify state-to-state escort reciprocity rules.
