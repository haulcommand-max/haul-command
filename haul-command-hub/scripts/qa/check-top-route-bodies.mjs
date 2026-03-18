#!/usr/bin/env node
/**
 * QA: check-top-route-bodies.mjs
 * Verifies top routes have h1, intro copy, and aren't shell-only.
 */
import { readFileSync } from 'fs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const config = JSON.parse(readFileSync('qa/routes-required.json', 'utf8'));

let failures = 0;

console.log(`\n📄 Checking ${config.topRoutes.length} top routes for content depth\n`);

for (const route of config.topRoutes) {
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) {
      console.log(`  ❌ ${route} → HTTP ${r.status}`);
      failures++;
      continue;
    }
    const html = await r.text();

    const hasH1 = /<h1[\s>]/i.test(html);
    const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const introLength = bodyText.length;
    const hasMinBody = introLength >= 300;
    const hasPageComponent = /<(section|article|main)/i.test(html);

    const issues = [];
    if (!hasH1) issues.push('missing_h1');
    if (!hasMinBody) issues.push(`body_too_short(${introLength})`);
    if (!hasPageComponent) issues.push('no_section/article/main');

    if (issues.length > 0) {
      console.log(`  ❌ ${route} → ${issues.join(', ')}`);
      failures++;
    } else {
      console.log(`  ✅ ${route}`);
    }
  } catch (e) {
    console.log(`  ❌ ${route} → ${e.message}`);
    failures++;
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Top Routes: ${config.topRoutes.length} checked, ${failures} failures\n`);
process.exit(failures > 0 ? 1 : 0);
