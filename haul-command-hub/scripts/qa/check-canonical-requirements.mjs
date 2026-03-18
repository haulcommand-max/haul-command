#!/usr/bin/env node
/**
 * QA: check-canonical-requirements.mjs
 * Verifies /requirements is canonical and /escort-requirements redirects properly.
 */
const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';

let failures = 0;

console.log('\n📋 Checking requirements canonicalization\n');

// 1. /requirements should exist (200)
try {
  const r = await fetch(`${BASE}/requirements`, { redirect: 'follow' });
  if (r.status >= 400) {
    console.log('  ❌ /requirements → ' + r.status);
    failures++;
  } else {
    console.log('  ✅ /requirements → ' + r.status);
  }
} catch (e) {
  console.log('  ❌ /requirements → ' + e.message);
  failures++;
}

// 2. /escort-requirements should redirect to /requirements
try {
  const r = await fetch(`${BASE}/escort-requirements`, { redirect: 'manual' });
  if (r.status === 301 || r.status === 308) {
    const loc = r.headers.get('location') || '';
    if (loc.includes('/requirements')) {
      console.log(`  ✅ /escort-requirements → ${r.status} → ${loc}`);
    } else {
      console.log(`  ❌ /escort-requirements redirects to wrong location: ${loc}`);
      failures++;
    }
  } else if (r.status === 200) {
    console.log('  ⚠️  /escort-requirements returns 200 (should redirect to /requirements)');
    // Not a hard failure during transition
  } else {
    console.log(`  ❌ /escort-requirements → ${r.status}`);
    failures++;
  }
} catch (e) {
  console.log('  ❌ /escort-requirements → ' + e.message);
  failures++;
}

console.log(`\n${failures === 0 ? '✅' : '❌'} Canonical Requirements: ${failures} failures\n`);
process.exit(failures > 0 ? 1 : 0);
