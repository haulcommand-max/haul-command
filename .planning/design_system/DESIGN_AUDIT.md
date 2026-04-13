# DESIGN AUDIT — Haul Command OS
**Status Date:** April 12, 2026
**Auditor:** Anti-Gravity (Gemini 3.1 Pro High)

## 1. Executive Summary
The Haul Command repository contains a massive, globally scaled Next.js application spanning over 96 core routing families and 106 component subdirectories. However, the current component infrastructure is fractured. The existing stack contains strong foundational CSS variables (`globals.css`) tuned for a "Command Black" OSOW-Killer aesthetic, and it has Capacitor properly loaded at root (`capacitor.config.ts`). 

**The primary structural flaw:** 
There are multiple raw layout patterns, ad-hoc tables, disjointed UI grids (some generic Tailwind "AI-generated" structures), and a lack of standardized visual regressions via Storybook. The app is vast, but it does not yet share a single owned `shadcn/ui` + `Motion` + `React Aria` component registry.

## 2. Source-of-Truth Validation
*   **Tailwind Config / Design Tokens:** Configured heavily in `app/globals.css`. A strong token hierarchy exists for `--hc-gold-*` and depth layers (`hc-bg`, `hc-surface`, `hc-elevated`, `hc-high`).
*   **Component Structure:** `components/ui` exists with 31 base files (`Button.tsx`, `StateButton.tsx`, `CommandMap.tsx`, `MetricCard.tsx`, raw `.tsx` files). This is not a unified generic registry; it's a mix of complex blocks and generic atoms.
*   **Capacitor:** `capacitor.config.ts` is confirmed in the root, meaning the mobile shell architecture exists but requires safe-area optimization.
*   **Page Families:** `app/directory`, `app/corridors`, `app/roles`, `app/regulations`, `app/tools`, are all active and deeply routed.

## 3. Top Priority Debt
1.  **Component Homogenization:** Rip out mixed generic Tailwind code. Collapse redundant `.tsx` atoms into formally owned `shadcn`-equivalent primitives.
2.  **Visual Overlays/Modals:** Normalize pop-outs. Move from raw `SectionShell.tsx` / `Card.tsx` wrapping to strict canonical structures.
3.  **No Dead Ends Rule:** Many deep SEO pages (`regulations`, `tools`) need the `NoDeadEndBlock` / `ProofStrip` correctly injected with proper spacing variables.
4.  **Mobile Viewport Fixes:** Eradicate any hardcoded `min-w-*` on deep nested tables `TanStack Table` logic must take over for horizontally scrollable data grids.
