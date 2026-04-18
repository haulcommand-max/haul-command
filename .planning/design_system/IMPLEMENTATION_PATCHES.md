# IMPLEMENTATION PATCHES (PHASES 1-5 PLAN)

The following groups outline the commits and patches required by the execution engine (Sonnet) to realize the Design System overhaul.

## PHASE 1: Design System Foundation (Repo: `app/globals.css`, `tailwind.config.ts`)
- **Patch 1A:** Strip stray hardcoded `text-gray-*` and `bg-slate-*` from generic components and strictly replace with `text-hc-muted` and `bg-hc-surface`.
- **Patch 1B:** Expand `globals.css` with missing typography clamp utilities for `text-metric` and `text-display` using Space Grotesk.

## PHASE 2: Owned Component System (`components/ui`)
- **Patch 2A:** Run `npx shadcn-ui@latest init` to lock the registry in the codebase if not fully deployed.
- **Patch 2B:** Absorb `PulsingButton.tsx` and `StateButton.tsx` logic into a global `<Button>` standard (variants: `default`, `gold`, `ghost`, `outline`, `pulse`). Delete legacy duplicates.
- **Patch 2C:** Integrate `React Aria` hooks for `FilterDropdown.tsx` to handle heavy keyboard navigation and screen-reader accessibility for sorting.

## PHASE 3: Page Family Rebuild (`app/*`)
- **Patch 3A:** Rebuild `app/corridors/[slug]/page.tsx` and `app/directory/[country]/page.tsx`. Force TanStack structure on lists. Replace standard `<p>` loops with grid-based `HC-Card` layouts. Let Motion handle the layout transitions between grids.
- **Patch 3B:** Update `app/(landing)/page.tsx` to utilize `PageFamilyBackground` and `CommandMap` natively, stripping stray gradients.

## PHASE 4: Mobile App Shell (`capacitor.config.ts`)
- **Patch 4A:** Introduce `@capacitor/status-bar` and `@capacitor/haptics`. Map haptics to the `onPress` events of primary conversion buttons (e.g., claiming a profile, confirming an escort job).

## PHASE 5: Regression & Polish
- **Patch 5A:** Initialize `Storybook` across all `components/ui/*`. Write atomic stories for all 31 existing primitives to lock against future drift.
