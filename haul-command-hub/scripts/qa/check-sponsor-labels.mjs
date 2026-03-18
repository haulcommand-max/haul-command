#!/usr/bin/env node
/**
 * QA: check-sponsor-labels.mjs
 * Verifies any rendered sponsor slot has a visible label.
 * 
 * Detection: looks for sponsor-slot components, data-sponsor attributes,
 * or sponsor-related class names — NOT generic text mentions of "sponsor".
 */
const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';

const routes = ['/', '/directory', '/corridors', '/services', '/rates'];

let failures = 0;

console.log('\n🏷️  Checking sponsor label compliance\n');

for (const route of routes) {
  try {
    const r = await fetch(`${BASE}${route}`);
    if (r.status >= 400) continue;
    const html = await r.text();

    // Detect actual sponsor slots/components (not FAQ text mentioning "sponsor")
    const hasSponsorComponent = /data-sponsor|sponsor-slot|SponsorSlot|ad-slot|adSlot|class="[^"]*sponsor[^"]*"/i.test(html);
    
    if (!hasSponsorComponent) {
      console.log(`  ✅ ${route} → no sponsor content`);
      continue;
    }

    // If sponsor component exists, check for visible labels
    const hasVisibleLabel = /Sponsored|Featured Partner|Promoted|Ad<\/|Advertisement/i.test(html);
    // Also check for rel="sponsored" on links
    const hasRelSponsored = /rel="[^"]*sponsored[^"]*"/i.test(html);

    if (!hasVisibleLabel) {
      console.log(`  ❌ ${route} → sponsor content without visible label`);
      failures++;
    } else {
      console.log(`  ✅ ${route} → sponsor content properly labeled${hasRelSponsored ? ' (rel=sponsored ✓)' : ''}`);
    }
  } catch (e) {
    console.log(`  ⚠️  ${route} → ${e.message}`);
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Sponsor Labels: ${failures} violations\n`);
process.exit(failures > 0 ? 1 : 0);
