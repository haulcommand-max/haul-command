# Directory UI / React Native Handoff Tasks

> **For Claude / Claude Opus**: Gemini 3.1 Pro has completed the deep data engineering, schema consolidation, and backend Intelligence logic for the Haul Command Directory "Crown Jewel". The data is now fully structured, indexed, and available directly via the Supabase Edge APIs.

**Your focus is strictly on the visual, React Native / iOS, and interactive components.** Do not attempt to recalculate confidence scores, merge SQL tables, or restructure the database. Gemini has already smashed redundancies and consolidated the Data OS.

## Task 1: MapLibre Coverage Heatmap Integration
Currently, the Directory results rely on list views and static number counts. We need to implement the MapLibre layer as defined in `HAUL_COMMAND_MASTER_SPEC_V2.yaml`.
*   **What to do:** Implement a visual heatmap over the directory using `MapLibre GL JS` (or `@rnmapbox/maps` on Mobile).
*   **Data Source:** Use the `coverage_cells` and `coverage_rollups` tables that Gemini has provisioned in `20260401_directory_intel_master.sql`.
*   **Requirements:** You must visualize pilot car supply density and active loads. When a user clicks a pin, render an interactive bottom sheet (on mobile) or a side panel (on web) with the operator's details.

## Task 2: React Native (Capacitor) Real-Time Push Notifications
The Directory's "Live available now" count requires real-time heartbeat data from escorts.
*   **What to do:** Wire up the `@novu/notification-center` and WebSockets in the Capacitor shell (or React Native wrapper).
*   **Requirements:** Ensure that when an escort goes "online", their device successfully transmits coordinates/status to `escort_presence`. The `DirectorySearchList` must then subscribe to the Supabase Realtime channel to turn their status dot "green" globally in less than 500ms.

## Task 3: Typesense / Meilisearch Client Integration (Optional/Later)
Gemini wrote a heavily optimized full-text SQL search RPC as a stopgap (to prevent breaking the current search UI while keeping things on Supabase). However, the master spec still recommends an external instantaneous search platform.
*   **What to do:** If we move off the Supabase RPC for search, you must write the front-end Typesense InstantSearch hooks (via `react-instantsearch-hooks-web`) and design the faceted capability filters (e.g. "High Pole", "Superload", "TWIC").

---

### Strict Guidelines:
*   **No backend regressions:** Do NOT delete or downgrade Gemini's newly added `hc_global_operators` confidence scoring and ranking fields.
*   **Build the "Crown Jewel":** Make the map visually stunning. This is the difference between a simple SaaS and an elite operational dashboard. Use premium dark-mode map styling (similar to Palantir/Uber Command centers).
