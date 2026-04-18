# DESIGN DEBT — FORCE RANKING (Updated Post-Phase 2)

## ✅ RESOLVED
1. ~~**Component Fragmentation:**~~ Three button implementations merged into one canonical `button.tsx` with CVA variants.
2. ~~**No shared component registry:**~~ 22 canonical components built with barrel export.
3. ~~**Missing overlays:**~~ Sheet, Dialog, DropdownMenu, Tooltip, Popover all built.
4. ~~**No empty state pattern:**~~ `EmptyState` component enforces "no dead ends."
5. ~~**Inline `<style>` in MobileBottomNav:**~~ Refactored to pure Tailwind tokens.

## 🔴 REMAINING — Critical
1. **Homepage Hardcoded Hex** — `HomeClient.tsx` uses `bg-[#0F1318]`, `text-[#8fa3b8]`, `border-[#C6923A]/40` etc. across 300+ lines. Must migrate to token classes.
2. **Table Infrastructure** — `Table.tsx` is a basic wrapper. Directory grids need TanStack Table for sorting, filtering, pagination, and column pinning.
3. **Badge Fragmentation** — `status-badge.tsx`, `TrustChips.tsx`, `FreshnessBadge.tsx` are separate from the canonical `Badge`. Must absorb their variants.

## 🟡 REMAINING — Important
4. **GlobalOmniSearch** — 7KB of custom search logic. Should upgrade to React Aria ComboBox for proper keyboard navigation and screen reader support.
5. **MetricCard → Card + StatBlock** — `MetricCard.tsx` (4KB) duplicates patterns now handled by `Card` + `StatBlock`.
6. **Inline `<style>` in HomeClient** — Lines 57-64 use inline `<style>` for responsive visibility. Should use Tailwind responsive utilities.
7. **Storybook Setup** — No visual regression testing infrastructure yet.

## 🟠 REMAINING — Moderate
8. **Page Family Drift** — Each page family has its own card/spacing/radius patterns. Must be normalized during Phase 3 page rebuilds.
9. **PulsingButton Cleanup** — Legacy `PulsingButton.tsx` still exists. The `dispatch` variant on `Button` replaces it.
10. **Map Overlay Components** — `CommandMap.tsx` (11KB), `HubMap.tsx` (7KB) lack shared overlay patterns.
