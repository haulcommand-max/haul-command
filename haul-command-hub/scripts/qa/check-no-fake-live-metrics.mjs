#!/usr/bin/env node
/**
 * QA: check-no-fake-live-metrics.mjs
 * Scans public routes for banned fake-live metric patterns.
 */
import { readFileSync } from 'fs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const config = JSON.parse(readFileSync('qa/fake-live-banned-patterns.json', 'utf8'));
const routes = JSON.parse(readFileSync('qa/routes-required.json', 'utf8'));

const bannedLower = config.bannedPatterns.map(p => p.toLowerCase());
const allowlist = config.allowlistContexts || [];

let failures = 0;

console.log(`\n🚫 Checking ${routes.topRoutes.length} routes for fake-live metric patterns\n`);

for (const route of routes.topRoutes) {
  if (allowlist.some(ctx => route.startsWith(ctx))) continue;
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) continue;
    const html = await r.text();
    const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();

    const found = bannedLower.filter(p => text.includes(p));
    if (found.length > 0) {
      console.log(`  ❌ ${route} → banned: ${found.join(', ')}`);
      failures++;
    } else {
      console.log(`  ✅ ${route}`);
    }
  } catch (e) {
    console.log(`  ⚠️  ${route} → ${e.message}`);
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Fake-Live Check: ${failures} violations\n`);
process.exit(failures > 0 ? 1 : 0);
