# VISUAL QA CHECKLIST

## Component-Level QA
- [ ] **Contrast:** Does all text on `--hc-surface` and `--hc-bg` exceed a 4.5:1 ratio?
- [ ] **Sizing:** Are all touch targets (buttons, list rows, tabs) a minimum of 44x44px for native mobile compliance?
- [ ] **State Changes:** Do hover, active, and focus states clearly leverage `--hc-row-hover` or `--hc-border-high`? 
- [ ] **Dark Fallbacks:** If a custom gradient is used, does it degrade gracefully into a solid `--hc-elevated` fill?

## Page-Level QA
- [ ] **Map & Header Safe Area:** Do mobile headers respect the `safe-area-inset` to avoid the notch?
- [ ] **No Dead Ends Rule:** Does the bottom of every SEO and Directory page feature a clear conversion block (e.g. `NoDeadEndBlock`, `ProofStrip`)?
- [ ] **Motion:** Are page transitions using Framer Motion restricted to `160ms` (`--transition-std`) or `280ms` (`--transition-slow`) to prevent laggy feelings?
- [ ] **Data Grids:** Does TanStack Table gracefully slide or fold columns on sub-640px displays without triggering a horizontal overflow on `body`?
