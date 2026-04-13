# COMPONENT INVENTORY — Phase 2 Complete

## Canonical Components (22 total)
All live in `components/ui/` with barrel export via `components/ui/index.ts`.

### Primitives (12)
| Component | File | Radix? | CVA? | Status |
|-----------|------|--------|------|--------|
| Button | `button.tsx` | Slot | ✅ | ✅ Built — 8 variants × 6 sizes, loading, asChild |
| Badge | `badge.tsx` | — | ✅ | ✅ Built — 10 variants inc. role-specific |
| Card | `card.tsx` | — | — | ✅ Built — 3 elevation levels, Header/Title/Content/Footer |
| Input | `input.tsx` | — | — | ✅ Built — 16px (no iOS zoom), gold focus |
| Textarea | `textarea.tsx` | — | — | ✅ Built |
| Label | `label.tsx` | ✅ | — | ✅ Built |
| Checkbox | `checkbox.tsx` | ✅ | — | ✅ Built — Gold check indicator |
| Switch | `switch.tsx` | ✅ | — | ✅ Built — Gold toggle |
| Separator | `separator.tsx` | ✅ | — | ✅ Built |
| Skeleton | `skeleton.tsx` | — | — | ✅ Built — Gold shimmer + Card/Row presets |
| StatBlock | `stat-block.tsx` | — | — | ✅ Built — Display font, trends |
| EmptyState | `empty-state.tsx` | — | — | ✅ Built — No dead ends enforcer |

### Overlays (5)
| Component | File | Radix? | Status |
|-----------|------|--------|--------|
| Dialog | `dialog.tsx` | ✅ | ✅ Built — Glass backdrop, modal surface |
| Sheet | `sheet.tsx` | ✅ | ✅ Built — Bottom-first, drag handle, 4 sides |
| DropdownMenu | `dropdown-menu.tsx` | ✅ | ✅ Built — Full with checkbox/radio items |
| Tooltip | `tooltip.tsx` | ✅ | ✅ Built |
| Popover | `popover.tsx` | ✅ | ✅ Built |

### Navigation (2)
| Component | File | Radix? | Status |
|-----------|------|--------|--------|
| Tabs | `tabs.tsx` | ✅ | ✅ Built — Gold active state |
| Accordion | `accordion.tsx` | ✅ | ✅ Built — Smooth height animation |

### Forms (2)
| Component | File | Radix? | Status |
|-----------|------|--------|--------|
| Select | `select.tsx` | ✅ | ✅ Built — Full dropdown, scroll buttons |
| Avatar | `avatar.tsx` | ✅ | ✅ Built — Verified gold ring |

### Composites (1)
| Component | File | Status |
|-----------|------|--------|
| FilterBar | `filter-bar.tsx` | ✅ Built — Search + mobile sheet + chips |

## Refactored Existing Components
| Component | Change |
|-----------|--------|
| MobileBottomNav | Eliminated 50+ lines of inline `<style>`, now pure Tailwind tokens |
| Button.tsx (PascalCase) | Now re-exports from canonical `button.tsx` |
| hc-button.tsx | Now re-exports from canonical `button.tsx` |

## Still Needs Canonicalization (Pre-existing, untouched)
- `MetricCard.tsx` → Should migrate to `Card` + `StatBlock`
- `SectionShell.tsx` → Keep as layout primitive, verify token usage
- `ProofStrip.tsx` → Keep, verify gold token usage
- `GlobalOmniSearch.tsx` → Consider React Aria combobox upgrade
- `TrustChips.tsx` → Should migrate to `Badge` variants
- `status-badge.tsx` → Should migrate to `Badge` variants
- `FreshnessBadge.tsx` → Should migrate to `Badge` variants
- `Table.tsx` → Must replace with TanStack Table integration
