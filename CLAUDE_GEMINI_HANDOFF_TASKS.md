# 🚀 HAUL COMMAND: LOWER-LEVEL ASSET HANDOFF

**To:** Gemini 3.1 Pro / Claude (UI & Scaffolding Execution Models)
**From:** Antigravity Action Model (System Architecture & Security Core)
**Context:** The live Level-2 Data Fort Knox, 1.56M Asset Matrix, and Freight Matching databases are entirely deployed. The master architecture is bulletproof. I am passing these lower-tier compute tasks to you so I don't waste architectural tokens doing boilerplate syntax work.

Do exactly as specified. Do not downgrade the existing tech stack. Do not rewrite my Edge Middlewares or PostgREST logic. Build what is commanded below strictly using `TailwindCSS`, `Radix UI`, and `Next.js App Router (React Server Components)` where applicable.

---

## 🎯 THE FOCUSED SPRINT TASKS (SKIP-LIST FOR ANTIGRAVITY)

### 1. TypeScript Scaffolding (Database Typing)
**Target:** Generate `types/supabase.ts` for front-end autocomplete.
**Instructions:** 
*   We have deployed massive new SQL architectures (`request_log`, `blocked_ips`, `loads`, `broker_profiles`, `escrow_payments`, `load_bids`). 
*   Run the Supabase CLI generator to pull the raw type definitions from the live production database schemas and output them strictly to `lib/types/supabase.ts`.

### 2. Boilerplate UI Components (Radix / Tailwind)
**Target:** Build out generic design-system UI components inside `components/ui/`.
**Instructions:**
*   Construct the standard `<Button />`, `<Card />`, `<Table />`, and `<FilterDropdown />` components.
*   The components must be responsive. Dark mode preferred (slate-950 background with emerald/rose accents mirroring the Defense Dashboard).

### 3. Static SEO Generation (The Global 57-Country Scaffolding)
**Target:** Generate the Next.js `generateStaticParams` static paths for the 57 tracked countries.
**Instructions:**
*   Create a dynamic route `app/directory/[countryCode]/page.tsx`
*   Ensure the page outputs pure static HTML targeting SEO search visibility. 
*   You do not need to build out the full database load mechanics here, just build the high-speed static HTML page templates with proper `<title>` and metadata JSON-LD injections.

### 4. Basic Test Coverage (Jest/Vitest)
**Target:** Baseline utility testing.
**Instructions:**
*   Write standard boolean unit tests for basic parsing utilities across the app (slug parsers, phone number formatters, time calculators).
*   No need for E2E testing or heavy puppeteer scripts yet, just core logic coverage.

---

### 🔥 RULES FOR GEMINI / CLAUDE:
1. **NO REDUNDANCIES:** I have already built complex `directory_listings` endpoints inside `api/directory/search/route.ts` that includes Geo-Censorship. DO NOT write another search API route that bypasses this.
2. **NEVER DOWNGRADE:** Use the latest App Router paradigms. Do not fall back to `useEffect` data-fetching where React Server Components (`await supabase.from()`) would be significantly faster and more SEO-optimized.
3. **DO NOT STOP:** Burn through these 4 tasks in a single uninterrupted sprint. No breaks until the boilerplate is functional.
