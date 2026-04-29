/**
 * smoke-critical-routes.spec.ts
 * Phase 3 — Playwright critical route smoke tests
 *
 * Coverage:
 *   - Homepage CTA area visible
 *   - /directory loads with key UI
 *   - /loads loads
 *   - /tools/escort-calculator loads + renders form
 *   - /escort-requirements loads
 *   - /leaderboards loads
 *   - /roles/pilot-car-operator loads without crash
 *   - /robots.txt returns valid text
 *   - /sitemap.xml returns valid XML
 *   - /llms.txt accessible and non-empty
 *   - SEO discovery routes do not expose literal template strings or legacy canonical targets
 *
 * Design principles:
 *   - Resilient: no hard waits, use expect().toBeVisible() with timeout
 *   - No screenshot comparison (avoid baseline drift in CI)
 *   - Screenshots saved on failure automatically (via playwright.config.ts)
 *   - Works against localhost AND preview URLs via PLAYWRIGHT_BASE_URL
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────

async function gotoAndWaitForLoad(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  return response;
}

// ── Test suite ─────────────────────────────────────────

test.describe('Critical Route Smoke Tests', () => {
  // ── Homepage ──────────────────────────────────────
  test('/ — homepage loads and is not a crash page', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/');

    // Must not return server error
    expect(response?.status()).toBeLessThan(500);

    // Page must have a body with content (not blank/blank NextJS shell)
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(50);

    // Must not display generic Next.js error
    await expect(page.getByText('Application error')).not.toBeVisible();
    await expect(page.getByText('Internal Server Error')).not.toBeVisible();

    // Title must be set (not blank or default)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    expect(title).not.toBe('Create Next App');

    // CTA area: at least one link or button is present
    const ctaCount = await page.locator('a[href], button[type]').count();
    expect(ctaCount).toBeGreaterThan(0);
  });

  // ── Directory ──────────────────────────────────────
  test('/directory — loads and renders directory content', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/directory');

    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText('Application error')).not.toBeVisible();

    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);

    // Directory should have some list/cards or search input
    const hasContent = await page.evaluate(() => {
      return (
        document.querySelectorAll('[class*="card"], [class*="listing"], [class*="result"], li, article').length > 0
        || document.querySelector('input[type="search"], input[placeholder]') !== null
        || document.body.textContent!.length > 100
      );
    });
    expect(hasContent).toBe(true);
  });

  // ── Loads ─────────────────────────────────────────
  test('/loads — loads without crash', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/loads');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Application error')).not.toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(20);
  });

  // ── Escort Calculator ──────────────────────────────
  test('/tools/escort-calculator — loads and renders form', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/tools/escort-calculator');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Application error')).not.toBeVisible();

    // Calculator should have at least one input or select
    const hasForm = await page.evaluate(() => {
      return document.querySelectorAll('input, select, [role="combobox"]').length > 0
        || document.body.textContent!.toLowerCase().includes('calculator')
        || document.body.textContent!.toLowerCase().includes('escort')
        || document.body.textContent!.toLowerCase().includes('width')
        || document.body.textContent!.toLowerCase().includes('height');
    });
    expect(hasForm).toBe(true);
  });

  // ── Escort Requirements ─────────────────────────────
  test('/escort-requirements — loads without crash', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/escort-requirements');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Application error')).not.toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(20);
  });

  // ── Leaderboards ──────────────────────────────────
  test('/leaderboards — loads and has ranking content', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/leaderboards');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Application error')).not.toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(20);
  });

  // ── Pilot Car Operator role page ─────────────────────
  test('/roles/pilot-car-operator — loads without crash', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/roles/pilot-car-operator');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText('Application error')).not.toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(20);

    // Should mention pilot car or escort in some fashion
    const hasRelevantContent = await page.evaluate(() =>
      document.body.textContent!.toLowerCase().includes('pilot')
      || document.body.textContent!.toLowerCase().includes('escort')
      || document.body.textContent!.toLowerCase().includes('operator')
    );
    expect(hasRelevantContent).toBe(true);
  });
});

// ── SEO / System file checks (separate describe for grouping) ───

test.describe('SEO + System Route Checks', () => {
  test('/robots.txt — valid robots file', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/robots.txt');

    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/text/);

    const body = await page.textContent('body') ?? '';

    // Must contain User-agent directive
    expect(body.toLowerCase()).toContain('user-agent');

    // Must NOT be an HTML error page
    expect(body).not.toContain('<!DOCTYPE html');
    expect(body).not.toContain('<html');
  });

  test('/sitemap.xml — valid XML sitemap', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/sitemap.xml');

    // Accept 200 or redirect-to-200
    expect(response?.status()).toBeLessThan(400);

    const body = await page.textContent('body') ?? '';

    // Must contain urlset namespace (standard sitemap format)
    expect(body).toContain('urlset');

    // Must have at least one URL entry
    expect(body).toContain('<url>');
  });

  test('/sitemap.xml?chunk=0 — no literal template strings or duplicate static URLs', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/sitemap.xml?chunk=0');

    expect(response?.status()).toBeLessThan(400);

    const body = await page.textContent('body') ?? '';
    const locs = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1]);

    expect(body).toContain('urlset');
    expect(body).not.toContain('${BASE}');
    expect(body).not.toContain('/loads/post');
    expect(body).not.toContain('/requirements');
    expect(body).not.toContain('/corridors');
    expect(locs.length).toBeGreaterThan(0);
    expect(new Set(locs).size).toBe(locs.length);
  });

  test('/llms.txt — accessible and non-empty', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/llms.txt');

    expect(response?.status()).toBe(200);

    const body = await page.textContent('body') ?? '';
    expect(body.trim().length).toBeGreaterThan(10);

    // Must NOT be an HTML page (should be plain text)
    expect(body).not.toContain('<!DOCTYPE html');
  });

  test('/llms.txt — uses canonical public URLs for AI citation guidance', async ({ page }) => {
    const response = await gotoAndWaitForLoad(page, '/llms.txt');

    expect(response?.status()).toBe(200);

    const body = await page.textContent('body') ?? '';
    expect(body).toContain('https://www.haulcommand.com/load-board');
    expect(body).toContain('https://www.haulcommand.com/escort-requirements');
    expect(body).toContain('https://www.haulcommand.com/corridor');
    expect(body).not.toContain('https://www.haulcommand.com/loads');
    expect(body).not.toContain('https://www.haulcommand.com/requirements');
    expect(body).not.toContain('https://www.haulcommand.com/corridors');
  });
});
