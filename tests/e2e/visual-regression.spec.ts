import { test, expect } from '@playwright/test';

const CRITICAL_PAGES = [
  { name: 'Directory', path: '/directory' },
  { name: 'Available Now', path: '/available-now' },
  { name: 'Corridor Command', path: '/corridor-command' },
  { name: 'Report Card', path: '/report-card/us-tx-999-001' },
  { name: 'Training', path: '/training' },
  { name: 'Command Center', path: '/dashboard/command' },
  { name: 'City Page', path: '/directory/us/tx-houston' },
  { name: 'Data Marketplace', path: '/data' },
  { name: 'Escort Calculator', path: '/tools/escort-calculator' },
  { name: 'Pricing', path: '/pricing' }
];

test.describe('Critical Surface Smoke & Visual Regression', () => {
  for (const pageInfo of CRITICAL_PAGES) {
    test(`Smoke Test: ${pageInfo.name} renders successfully without errors`, async ({ page }) => {
      // Navigate to the critical surface
      const response = await page.goto(pageInfo.path);
      
      // Basic HTTP smoke check
      expect(response?.status()).toBeLessThan(400);

      // Wait for network idle to ensure initial components (including Ads) mounted
      await page.waitForLoadState('networkidle');

      // Ensure the page body is visible and no Next.js error overlays
      const bodyVisible = await page.isVisible('body');
      expect(bodyVisible).toBeTruthy();

      const nextErrorOverlay = await page.locator('#nextjs-portal').isVisible().catch(() => false);
      expect(nextErrorOverlay).toBeFalsy();

      // Visual regression snapshot
      await expect(page).toHaveScreenshot(`${pageInfo.name.replace(/ /g, '-').toLowerCase()}-snapshot.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.1 // Allow small differences for dynamic feed/ads
      });
    });
  }
});
