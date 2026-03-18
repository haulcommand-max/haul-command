#!/usr/bin/env node
/**
 * QA: check-nav-footer-links.mjs
 * Verifies every link in Navbar and Footer resolves (not 404/500).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';

// Extract links from source files
function extractHrefs(filePath) {
  try {
    const src = readFileSync(resolve(filePath), 'utf8');
    const matches = [...src.matchAll(/href\s*[=:]\s*['"`]([^'"`{]+)['"`]/g)];
    return matches.map(m => m[1]).filter(h => h.startsWith('/'));
  } catch { return []; }
}

const navLinks = extractHrefs('src/components/Navbar.tsx');
const footerLinks = extractHrefs('src/components/Footer.tsx');
const allLinks = [...new Set([...navLinks, ...footerLinks])];

let failures = 0;
let checked = 0;

console.log(`\n🔗 Checking ${allLinks.length} nav/footer links against ${BASE}\n`);

for (const href of allLinks) {
  try {
    const r = await fetch(`${BASE}${href}`, { redirect: 'follow' });
    checked++;
    if (r.status >= 400) {
      console.log(`  ❌ ${href} → ${r.status}`);
      failures++;
    } else {
      console.log(`  ✅ ${href} → ${r.status}`);
    }
  } catch (e) {
    console.log(`  ❌ ${href} → NETWORK ERROR: ${e.message}`);
    failures++;
    checked++;
  }
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Nav/Footer Links: ${checked} checked, ${failures} failures\n`);
process.exit(failures > 0 ? 1 : 0);
