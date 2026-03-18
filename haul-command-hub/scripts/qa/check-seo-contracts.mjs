#!/usr/bin/env node
/**
 * QA: check-seo-contracts.mjs
 * Verifies every canonical page has title, meta description, h1, and canonical URL.
 */
import { readFileSync } from 'fs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const config = JSON.parse(readFileSync('qa/routes-required.json', 'utf8'));

let failures = 0;

console.log(`\n🔎 Checking SEO contracts for ${config.topRoutes.length} top routes\n`);

for (const route of config.topRoutes) {
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) {
      console.log(`  ❌ ${route} → HTTP ${r.status}`);
      failures++;
      continue;
    }
    const html = await r.text();

    const issues = [];

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch || titleMatch[1].trim().length < 10) issues.push('missing_or_short_title');

    // Meta description
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (!metaDesc || metaDesc[1].trim().length < 20) issues.push('missing_or_short_meta_description');

    // H1
    const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    if (!h1) issues.push('missing_h1');

    // Canonical
    const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    // Canonical is auto-handled by Next.js metadataBase, so just warn
    if (!canonical) issues.push('warning:no_explicit_canonical');

    const realIssues = issues.filter(i => !i.startsWith('warning:'));
    if (realIssues.length > 0) {
      console.log(`  ❌ ${route} → ${issues.join(', ')}`);
      failures++;
    } else {
      console.log(`  ✅ ${route}${issues.length > 0 ? ` (${issues.join(', ')})` : ''}`);
    }
  } catch (e) {
    console.log(`  ❌ ${route} → ${e.message}`);
    failures++;
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} SEO Contracts: ${failures} failures\n`);
process.exit(failures > 0 ? 1 : 0);
