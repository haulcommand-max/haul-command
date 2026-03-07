import { test, expect } from '@playwright/test';

/**
 * PATCH-010: Screenshot-based UI regression checks.
 * Captures baseline screenshots for critical pages.
 * Fails CI if visual diffs exceed threshold.
 *
 * Usage:
 *   First run (create baselines):  npx playwright test --update-snapshots
 *   CI / subsequent runs:          npx playwright test
 */

test.describe('Visual Regression', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for animations to settle
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('directory page renders correctly', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('directory.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('mobile homepage renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test('mobile bottom nav is visible and not clipped', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Bottom nav should be visible
    const bottomNav = page.locator('.mobile-bottom-nav-shell');
    await expect(bottomNav).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-bottom-nav.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });
});
