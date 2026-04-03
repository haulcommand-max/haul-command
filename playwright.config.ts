import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration — Haul Command
 *
 * Self-optimization notes (Phase 7):
 * - fullyParallel: true — tests run in parallel by default
 * - CI uses 2 workers — balance speed vs resource constraints
 * - retries: 2 in CI — catch flaky network conditions on preview URLs
 * - Chromium only in CI smoke tests (mobile covered in dedicated job)
 * - Screenshots + traces on failure — always
 * - baseURL: overridden via PLAYWRIGHT_BASE_URL for preview validation
 */
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // 2 workers in CI (prevents GitHub Actions OOM), unlimited locally
    workers: process.env.CI ? 2 : undefined,
    // In CI, use github reporter for inline annotations + html for artifacts
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : 'html',
    timeout: 30_000,

    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off', // Save CI minutes; enable locally for debugging
        // Extra timeout for preview URL (cold start)
        navigationTimeout: process.env.PLAYWRIGHT_BASE_URL?.startsWith('https')
            ? 45_000
            : 30_000,
    },

    expect: {
        // Generous timeout for assertions against remote preview URLs
        timeout: process.env.PLAYWRIGHT_BASE_URL?.startsWith('https')
            ? 15_000
            : 5_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
        },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 7'] },
            // Only run mobile tests in non-smoke suites to keep CI fast
            testIgnore: /smoke-critical-routes\.spec\.ts/,
        },
    ],

    // Local dev: auto-start the Next.js dev server
    webServer: process.env.CI
        ? undefined
        : {
            command: 'npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 120_000,
        },
});
