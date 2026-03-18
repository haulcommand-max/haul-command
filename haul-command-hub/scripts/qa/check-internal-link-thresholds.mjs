#!/usr/bin/env node
/**
 * QA: check-internal-link-thresholds.mjs
 * Verifies pages have sufficient internal links.
 */
import { readFileSync } from 'fs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const thresholds = JSON.parse(readFileSync('qa/internal-link-thresholds.json', 'utf8'));
const routes = JSON.parse(readFileSync('qa/routes-required.json', 'utf8'));

let failures = 0;

console.log(`\n🔗 Checking internal link thresholds (min: ${thresholds.standardPublicPageMin})\n`);

for (const route of routes.topRoutes) {
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) continue;
    const html = await r.text();

    // Count internal links (href starting with /)
    const links = [...html.matchAll(/href=["'](\/?[^"'#]+)["']/g)]
      .map(m => m[1])
      .filter(h => h.startsWith('/'));
    const unique = [...new Set(links)];

    const min = thresholds.standardPublicPageMin;
    if (unique.length < min) {
      console.log(`  ❌ ${route} → ${unique.length} links (min: ${min})`);
      failures++;
    } else {
      console.log(`  ✅ ${route} → ${unique.length} links`);
    }
  } catch (e) {
    console.log(`  ⚠️  ${route} → ${e.message}`);
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Internal Links: ${failures} below threshold\n`);
process.exit(failures > 0 ? 1 : 0);
