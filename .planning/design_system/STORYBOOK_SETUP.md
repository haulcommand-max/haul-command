# STORYBOOK SETUP & REGRESSION CHECKLIST

## Setup
In a zero-paid-dependency requirement, Storybook guarantees enterprise-level visual QA without renting external systems like Chromatic for the core component isolation.
`npx storybook@latest init`

## Visual Regression Checklist
For every canonical `shadcn`-owned component generated, verify:

- [ ] **Dark Mode Premium Check:** Does the background correctly use `--hc-elevated` and not muddy gray?
- [ ] **Gold Contrast Pass:** Does `--hc-gold-500` pass WCAG AA against the component's base?
- [ ] **Data States:** Are Empty, Loading (Skeleton), and Error states built into the story?
- [ ] **Mobile Overrides:** Does the component break constraints inside a `320px` wrapper?
- [ ] **A11y:** Are React Aria labels correctly persisting when mapped via `shadcn`?
- [ ] **Font Render:** Is `Space Grotesk` or `Inter` tracking correctly?

Storybook serves as the source of truth for the 120-country styling standard to prevent standard regression and component hijacking during parallel feature branches.
