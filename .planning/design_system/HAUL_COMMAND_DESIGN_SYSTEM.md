# HAUL COMMAND DESIGN SYSTEM v5
**Status:** Phase 2 Complete — 22 canonical components built
**Stack:** Tailwind v4 + shadcn/ui (owned) + Radix + CVA + Motion + TanStack Table + React Aria

---

## Architecture

```
components/ui/               ← Owned design system (shadcn pattern)
├── index.ts                  ← Barrel export for all components
├── button.tsx                ← Unified canonical button (8 variants × 6 sizes)
├── badge.tsx                 ← Status/role badges with 10 variants
├── card.tsx                  ← 3-elevation surface system
├── input.tsx                 ← Gold-focus dark inputs (16px = no iOS zoom)
├── textarea.tsx              ← Multi-line variant
├── label.tsx                 ← Accessible form labels
├── checkbox.tsx              ← Gold check on dark surface
├── switch.tsx                ← Availability/notification toggles
├── select.tsx                ← Full dropdown with scroll buttons
├── dialog.tsx                ← Glass-backdrop modal
├── sheet.tsx                 ← Bottom drawer (mobile-first, drag handle)
├── tabs.tsx                  ← Gold active indicator segments
├── accordion.tsx             ← FAQ/regulation collapsibles
├── dropdown-menu.tsx         ← Context/action menus
├── tooltip.tsx               ← Info hover on badges
├── popover.tsx               ← Floating panels
├── separator.tsx             ← Token-based dividers
├── skeleton.tsx              ← Gold shimmer + Card/Row prebuilts
├── empty-state.tsx           ← NO DEAD ENDS enforcer
├── stat-block.tsx            ← Metric display with trends
├── filter-bar.tsx            ← Search + mobile sheet + chips composite
├── Button.tsx                ← Re-export bridge (backward compat)
└── hc-button.tsx             ← Re-export bridge (backward compat)
```

## Design Constitution (17 Laws)

1. Dark-surface premium, not dark-muddy
2. Primary actions obvious immediately
3. Secondary actions calm, not invisible
4. Every page: hierarchy, proof, clean next step
5. No dead ends
6. No ugly generic Tailwind "AI-generated" sections
7. No random border radii
8. No random icon families
9. No low-contrast text
10. No cramped cards
11. No giant empty dark voids
12. No component inventions when a shared pattern exists
13. Every repeated UI pattern must be systematized
14. Every table/list/map/filter must feel premium and fast
15. Motion supports clarity, not showing off
16. Web and mobile share brand language, respect platform conventions
17. All pages support future localization, RTL, long labels, currencies

## Token Reference

| Category | Token | Value |
|----------|-------|-------|
| Primary Gold | `hc-gold-500` | `#C6923A` |
| Background | `hc-bg` | `#0F1318` |
| Surface L1 | `hc-surface` | `#111214` |
| Surface L2 | `hc-elevated` | `#16181B` |
| Surface L3 | `hc-high` | `#1E2028` |
| Text Primary | `hc-text` | `#F3F4F6` |
| Text Secondary | `hc-muted` | `#B0B8C4` |
| Border | `hc-border` | `#23262B` |
| Success | `hc-success` | `#22C55E` |
| Warning | `hc-warning` | `#F59E0B` |
| Danger | `hc-danger` | `#EF4444` |
| Broker Role | `hc-broker` | `#4299E1` |
| Escort Role | `hc-escort` | `#C6923A` |
| Corridor Role | `hc-corridor` | `#9F7AEA` |

## Component API Summary

### Button
```tsx
<Button variant="primary|dispatch|secondary|ghost|outline|muted|danger|link"
        size="sm|md|default|lg|xl|icon"
        loading={false} asChild={false}
        leftIcon={<Icon />} rightIcon={<Icon />}
        fullWidth={false} />
```

### Badge
```tsx
<Badge variant="gold|success|warning|danger|info|broker|escort|corridor|muted"
       dot={false} />
```

### Card
```tsx
<Card elevation={1|2|3} glow={false} noPadding={false}>
  <CardHeader><CardTitle /><CardDescription /></CardHeader>
  <CardContent />
  <CardFooter />
</Card>
```

### Sheet (Mobile Bottom Drawer)
```tsx
<Sheet>
  <SheetTrigger asChild><Button>Open</Button></SheetTrigger>
  <SheetContent side="bottom|top|left|right">
    <SheetHeader><SheetTitle /><SheetDescription /></SheetHeader>
    {content}
    <SheetFooter />
  </SheetContent>
</Sheet>
```

### FilterBar
```tsx
<FilterBar
  searchPlaceholder="Search operators..."
  searchValue={query}
  onSearchChange={setQuery}
  activeFilterCount={3}
  filterContent={<FilterControls />}
  chips={<ChipRail />}
  sticky
/>
```

### EmptyState
```tsx
<EmptyState
  icon={SearchX}
  title="No operators found"
  description="Try adjusting your filters or expanding your search area."
  action={{ label: "Clear filters", onClick: handleClear }}
  secondaryAction={{ label: "Browse all", href: "/directory" }}
/>
```
