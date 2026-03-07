# Haul Command — Patch Log

Every fix must reference a patch ID and include before/after notes.

| Patch ID | Date | Description | Files Changed | Status |
|----------|------|-------------|---------------|--------|
| PATCH-001 | 2026-03-05 | Lock no-regressions guardrail | PATCHLOG.md, scripts/verify-no-regressions.mjs | Applied |
| PATCH-002 | 2026-03-05 | Fix mobile safe-area + bottom buttons cut off | globals.css, mobile-bottom-nav.tsx, (app)/layout.tsx | Applied |
| PATCH-003 | 2026-03-05 | Fix header/top content clipped | globals.css, HomeClient.tsx, (app)/layout.tsx | Applied |
| PATCH-004 | 2026-03-05 | Fix green dots stuck in top corner | globals.css (live-ping keyframe + container) | Applied |
| PATCH-005 | 2026-03-05 | Fix homepage alignment/spacing | globals.css (page-shell, spacing tokens) | Applied |
| PATCH-006 | 2026-03-05 | Add social login UI with feature flags | components/auth/SocialLoginButtons.tsx | Applied |
| PATCH-007 | 2026-03-05 | Add dev-only auth status banner | components/dev/AuthStatusBanner.tsx | Applied |
| PATCH-008 | 2026-03-05 | Add clean:all + doctor scripts | package.json, scripts/doctor.mjs | Applied |
| PATCH-009 | 2026-03-05 | Fix Facebook cover workflow exports | scripts/brand/facebook-cover.mjs | Applied |
| PATCH-010 | 2026-03-05 | Add Playwright screenshot regression tests | tests/e2e/visual-regression.spec.ts, playwright.config.ts | Applied |
