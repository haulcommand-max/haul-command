#!/usr/bin/env node
/**
 * QA: check-mobile-overflow.mjs
 * Checks for horizontal overflow on mobile viewport.
 * NOTE: This is a static HTML check — full browser check needs Playwright.
 */
const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';

const routes = ['/', '/directory', '/requirements', '/loads', '/corridors', '/rates', '/claim'];

let failures = 0;

console.log('\n📱 Checking mobile-critical routes for overflow signals\n');

for (const route of routes) {
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) continue;
    const html = await r.text();

    // Check for common overflow causes
    const issues = [];
    if (/width:\s*\d{4,}px/i.test(html)) issues.push('hardcoded_wide_px');
    if (/overflow-x:\s*visible/i.test(html) && /width:\s*\d{3,}vw/i.test(html)) issues.push('vw_overflow');
    if (/<table/i.test(html) && !/<div[^>]*overflow/i.test(html) && !/<div[^>]*scroll/i.test(html)) {
      // Table without scroll wrapper — potential overflow
      issues.push('unwrapped_table');
    }

    // Check for mobile bottom nav presence
    const hasBottomNav = /MobileBottomNav/i.test(html) || /fixed bottom-0/i.test(html) || /sticky.*bottom/i.test(html);

    if (!hasBottomNav) issues.push('no_mobile_bottom_nav_signal');

    if (issues.length > 0) {
      console.log(`  ⚠️  ${route} → ${issues.join(', ')}`);
      // Only fail on hardcoded overflow, warn on others
      if (issues.includes('hardcoded_wide_px')) failures++;
    } else {
      console.log(`  ✅ ${route}`);
    }
  } catch (e) {
    console.log(`  ⚠️  ${route} → ${e.message}`);
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Mobile Overflow: ${failures} failures\n`);
console.log('Note: Full overflow detection requires a browser-based test (Playwright).\n');
process.exit(failures > 0 ? 1 : 0);
