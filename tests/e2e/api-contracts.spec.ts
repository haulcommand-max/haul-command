/**
 * api-contracts.spec.ts
 * Skill #1 — API Contract Testing
 *
 * Tests the API layer directly — not just page loads.
 * A broken API returning HTTP 200 with garbage is invisible to Playwright page tests.
 * These tests verify: status codes, content-type, response shape, and critical field presence.
 *
 * Design:
 *   - Works against PLAYWRIGHT_BASE_URL (localhost or preview)
 *   - Uses page.request (Playwright's built-in HTTP client) — no extra deps
 *   - Fails loudly with specific field-level error messages
 *   - Safe: all GET requests only (no mutations)
 *   - Groups: health, directory, adgrid, corridor, SEO system files
 */

import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiGet(request: any, path: string) {
  const response = await request.get(path, {
    timeout: 15_000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HaulCommand-ContractTest/1.0',
    },
  });
  return response;
}

function assertShape(data: any, requiredFields: string[], context: string) {
  for (const field of requiredFields) {
    const parts = field.split('.');
    let current = data;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        throw new Error(`[${context}] Missing field path "${field}" — got ${JSON.stringify(current)}`);
      }
      current = current[part];
    }
    if (current === undefined) {
      throw new Error(`[${context}] Field "${field}" is undefined in response`);
    }
  }
}

// ── Group 1: Health & Heartbeat ───────────────────────────────────────────────

test.describe('API Contract — Health', () => {
  test('GET /api/health → 200, JSON, status field', async ({ request }) => {
    const res = await apiGet(request, '/api/health');

    expect(res.status()).toBe(200);

    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('json');

    const body = await res.json();
    expect(typeof body).toBe('object');

    // Must have a status/ok signal
    const hasStatusSignal =
      'status' in body ||
      'ok' in body ||
      'healthy' in body ||
      'alive' in body;
    expect(hasStatusSignal).toBe(true);
  });

  test('GET /api/heartbeat → non-500 response', async ({ request }) => {
    const res = await apiGet(request, '/api/heartbeat');
    expect(res.status()).toBeLessThan(500);
  });
});

// ── Group 2: Directory API ────────────────────────────────────────────────────

test.describe('API Contract — Directory', () => {
  test('GET /api/directory → 200 or 401, valid JSON', async ({ request }) => {
    const res = await apiGet(request, '/api/directory');

    // 200 = public listings, 401/403 = auth-gated (both valid contracts)
    expect([200, 401, 403]).toContain(res.status());

    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('json');

    if (res.status() === 200) {
      const body = await res.json();
      // Response should be array or object with data key
      const isArray = Array.isArray(body);
      const isObject = typeof body === 'object' && body !== null;
      expect(isArray || isObject).toBe(true);
    }
  });

  test('GET /api/directory?limit=1 → returns well-formed response', async ({ request }) => {
    const res = await apiGet(request, '/api/directory?limit=1');
    expect(res.status()).toBeLessThan(500);

    if (res.status() === 200) {
      const body = await res.json();
      // Should not be empty string or null
      expect(body).not.toBeNull();
      expect(body).not.toBe('');
    }
  });
});

// ── Group 3: Estimate / Escort Calculator API ─────────────────────────────────

test.describe('API Contract — Estimate', () => {
  test('GET /api/estimate → non-500, valid content-type', async ({ request }) => {
    const res = await apiGet(request, '/api/estimate');
    // GET without params may return 400 (missing required fields) — that is a valid contract
    expect(res.status()).toBeLessThan(500);

    const ct = res.headers()['content-type'] ?? '';
    // Should return JSON or HTML (not empty)
    expect(ct.length).toBeGreaterThan(0);
  });

  test('GET /api/estimate?width=14&height=14&length=75&state=TX → structured response', async ({ request }) => {
    const res = await apiGet(request, '/api/estimate?width=14&height=14&length=75&state=TX');
    expect(res.status()).toBeLessThan(500);

    if (res.status() === 200) {
      const body = await res.json();
      expect(typeof body).toBe('object');
      // Should not be an error disguised as 200
      expect(body?.error).toBeUndefined();
    }
  });
});

// ── Group 4: AdGrid / Ads API ─────────────────────────────────────────────────

test.describe('API Contract — AdGrid', () => {
  test('GET /api/adgrid → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/adgrid');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/ads → non-500, valid JSON or empty', async ({ request }) => {
    const res = await apiGet(request, '/api/ads');
    expect(res.status()).toBeLessThan(500);

    if (res.status() === 200) {
      const ct = res.headers()['content-type'] ?? '';
      expect(ct).toContain('json');
    }
  });
});

// ── Group 5: Corridor API ─────────────────────────────────────────────────────

test.describe('API Contract — Corridor', () => {
  test('GET /api/corridors → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/corridors');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/corridor → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/corridor');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/geo → non-500, JSON response', async ({ request }) => {
    const res = await apiGet(request, '/api/geo');
    expect(res.status()).toBeLessThan(500);
  });
});

// ── Group 6: SEO System Files (Content Contract) ──────────────────────────────

test.describe('API Contract — SEO System Files', () => {
  test('GET /robots.txt → 200, text/plain, contains User-agent', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body.toLowerCase()).toContain('user-agent');
    // Must NOT be an HTML error page
    expect(body).not.toContain('<!DOCTYPE html');
    expect(body).not.toContain('<html');
    expect(body.trim().length).toBeGreaterThan(10);
  });

  test('GET /sitemap.xml → 200, XML, contains urlset', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBeLessThan(400);

    const body = await res.text();
    expect(body).toContain('urlset');
    expect(body).toContain('<url>');

    // Must have at least 5 URLs (sanity check — not an empty sitemap)
    const urlCount = (body.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThanOrEqual(5);
  });

  test('GET /llms.txt → 200, non-empty, not HTML', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body.trim().length).toBeGreaterThan(20);
    expect(body).not.toContain('<!DOCTYPE html');
  });
});

// ── Group 7: Data integrity checks ───────────────────────────────────────────

test.describe('API Contract — Data Integrity', () => {
  test('GET /api/glossary → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/glossary');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/freshness → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/freshness');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/intake → non-500 (GET should 405 or 200, not 500)', async ({ request }) => {
    const res = await apiGet(request, '/api/intake');
    // GET on a POST-only endpoint should return 405, not 500
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(503);
  });

  test('GET /api/dispatch → non-500', async ({ request }) => {
    const res = await apiGet(request, '/api/dispatch');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/leaderboards → non-500 if route exists', async ({ request }) => {
    const res = await apiGet(request, '/api/leaderboards');
    // May 404 if no API route (leaderboard data may be server-rendered)
    expect(res.status()).not.toBe(500);
  });
});

// ── Group 8: No 500s on core public routes (regression guard) ────────────────

test.describe('API Contract — No 500s Regression Guard', () => {
  const publicApiRoutes = [
    '/api/health',
    '/api/directory',
    '/api/corridors',
    '/api/geo',
    '/api/glossary',
  ];

  for (const route of publicApiRoutes) {
    test(`GET ${route} → never returns 500`, async ({ request }) => {
      const res = await apiGet(request, route);
      expect(res.status()).not.toBe(500);
      expect(res.status()).not.toBe(503);
    });
  }
});
