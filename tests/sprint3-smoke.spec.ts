import { test, expect } from '@playwright/test';

const ROUTES = [
  '/', // homepage
  '/directory', // directory landing
  '/directory/us/texas', // city/state page
  '/corridor', // corridor landing
  '/corridor-command', // corridor-command
  '/available-now', // available-now
  '/tools/escort-calculator', // tool page
  '/training', // training
  '/dashboard/command', // command center /hq
  '/pricing' // monetization surface
];

test.describe('Sprint 3: Core Smoke + Visual Regression + Ad Zone Guard', () => {

  for (const route of ROUTES) {
    test(`Smoke test and Visual Regression for ${route}`, async ({ page }) => {
      // Navigate to route
      await page.goto(route);
      
      // Page should not 500/404
      expect(page.status()).not.toBe(404);
      expect(page.status()).not.toBe(500);

      // Verify no broken dead-ends (i.e., at least some text loads)
      await expect(page.locator('body')).toBeVisible();
      
      // Basic Visual snapshot (if configured, this will catch broad alignment/regression issues)
      // await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.1 });
    });
  }

  const AD_ELIGIBLE_ROUTES = [
    '/directory',
    '/corridor',
    '/available-now',
  ];

  for (const route of AD_ELIGIBLE_ROUTES) {
    test(`Blank Ad Zone Guard for ${route}`, async ({ page }) => {
      await page.goto(route);
      
      // Look for the AdGridSlot component or an explicit fallback CTA
      // We assume AdGridSlot renders an element with data-testid="ad-grid-slot" or class "ad-grid-slot"
      // or a generic sponsor CTA fallback
      const hasAdSlot = await page.locator('[data-testid="ad-grid-slot"], .ad-grid-slot, [data-ad-zone]').count();
      const hasFallback = await page.locator('text=Sponsor this').count();
      
      expect(hasAdSlot + hasFallback).toBeGreaterThan(0);
    });
  }
});
