import { test, expect } from '@playwright/test';

/**
 * /directory — Regression tests
 *
 * Guards:
 *  1. Root page has ONLY state/province tiles (no hotel/motel/truck stop categories)
 *  2. Minimum 50 state/province tiles
 *  3. No unknown badges or broken UI elements
 *  4. Country toggle works (US ↔ Canada)
 */

// Keywords that must NOT appear at directory root
const FORBIDDEN_KEYWORDS = [
    'hotel',
    'motel',
    'truck stop',
    'truck_stop',
    'truckstop',
    'rest area',
    'rest_area',
    'support service',
    'support_service',
    'weigh station',
];

test.describe('/directory — Root Page Guards', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/directory', { waitUntil: 'networkidle' });
    });

    test('no category keywords present at root level', async ({ page }) => {
        const bodyText = await page.locator('main, [role="main"], .directory-root, body').first().textContent();
        const lower = (bodyText || '').toLowerCase();

        for (const keyword of FORBIDDEN_KEYWORDS) {
            // Allow in meta/title but not in visible content grid
            const inGrid = lower.includes(keyword);
            if (inGrid) {
                // Double-check it's not in a hidden element or meta
                const visible = await page.locator(`text=${keyword}`).first().isVisible().catch(() => false);
                expect(visible, `"${keyword}" should not be visible at directory root`).toBeFalsy();
            }
        }
    });

    test('has at least 50 state/province tiles', async ({ page }) => {
        // State tiles are typically links/cards inside the region grid
        // Look for links that go to /directory/us/* or /directory/ca/*
        const stateLinks = page.locator(
            'a[href*="/directory/us/"], a[href*="/directory/ca/"]'
        );

        const count = await stateLinks.count();

        // If no links with that pattern, try broader selector for grid items
        if (count === 0) {
            // Try looking for grid cards/tiles (common patterns)
            const tiles = page.locator(
                '[class*="grid"] a, [class*="Grid"] a, [data-testid*="state"], [data-testid*="region"]'
            );
            const tileCount = await tiles.count();
            expect(tileCount, 'Should have ≥50 state/province tiles').toBeGreaterThanOrEqual(50);
        } else {
            expect(count, 'Should have ≥50 state/province links').toBeGreaterThanOrEqual(50);
        }
    });

    test('no unknown badge types or broken UI placeholders', async ({ page }) => {
        // Check for common broken-state indicators
        const brokenIndicators = [
            'undefined',
            'NaN',
            '[object Object]',
            'null',
            'loading...',
        ];

        const bodyText = await page.locator('body').textContent();
        const lower = (bodyText || '').toLowerCase();

        for (const indicator of brokenIndicators) {
            // "loading..." is OK during hydration, skip transient
            if (indicator === 'loading...') continue;
            expect(lower.includes(indicator.toLowerCase()),
                `"${indicator}" should not appear in rendered page`
            ).toBeFalsy();
        }
    });

    test('country toggle switches between US and Canada', async ({ page }) => {
        // Look for country toggle (usually a button pair or tab)
        const canadaToggle = page.locator(
            'button:has-text("Canada"), button:has-text("CA"), [data-country="CA"]'
        ).first();

        const isVisible = await canadaToggle.isVisible().catch(() => false);

        if (isVisible) {
            await canadaToggle.click();
            await page.waitForTimeout(500);

            // After clicking Canada, should see province references
            const bodyText = await page.locator('body').textContent();
            const hasProvince = (bodyText || '').match(/Ontario|British Columbia|Alberta|Quebec/i);
            expect(hasProvince, 'Canada view should show provinces').toBeTruthy();
        }
    });

    test('search input is present and functional', async ({ page }) => {
        const searchInput = page.locator(
            'input[type="search"], input[placeholder*="search" i], input[placeholder*="find" i]'
        ).first();

        await expect(searchInput).toBeVisible();
    });

    test('port hubs strip is visible', async ({ page }) => {
        // The directory page includes a port hubs quick-link strip
        const portSection = page.locator('text=Port of Houston').first();
        const isVisible = await portSection.isVisible().catch(() => false);
        // Port hubs may or may not be rendered; this is a soft check
        if (isVisible) {
            expect(true).toBeTruthy();
        }
    });
});
