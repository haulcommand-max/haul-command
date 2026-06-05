#!/usr/bin/env node
/**
 * Haul Command Mock-to-Live Audit
 *
 * Fails production readiness if high-risk production files still contain
 * mock-only patterns, fake credentials, old Pinecone wiring, or demo arrays.
 * This is intentionally lightweight and dependency-free so Claude/CI can run it.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

const CHECKS = [
  {
    file: 'app/api/quote/route.ts',
    status: 'mock_only',
    reason: 'Quote pricing must not use hardcoded example rates or mock currency.',
    patterns: [/Example dynamic pricing rules/i, /mock/i, /baseRatePerMile\s*=\s*countryCode/i]
  },
  {
    file: 'lib/ai/vector-layer.ts',
    status: 'deprecated',
    reason: 'Vector search must be Supabase-first. Pinecone/mock vector returns are deprecated.',
    patterns: [/Pinecone/i, /mock-key/i, /mock-uuid/i, /simulated embeddings/i]
  },
  {
    file: 'components/command/GlobalDensityMap.tsx',
    status: 'mock_only',
    reason: 'Global density map must not rely on mock Mapbox token or prop-only markers for production.',
    patterns: [/architectural scaffolding/i, /mock-user/i, /markers\s*=\s*\[\]/i]
  },
  {
    file: 'components/mobile/screens/MobileAdGrid.tsx',
    status: 'mock_only',
    reason: 'AdGrid must use live sponsor/slot inventory or dev-only fixtures.',
    patterns: [/MOCK_SPONSORS/i]
  },
  {
    file: 'components/mobile/screens/MobileCorridors.tsx',
    status: 'mock_only',
    reason: 'Corridors must use live corridor stats or dev-only fixtures.',
    patterns: [/MOCK_CORRIDORS/i]
  },
  {
    file: 'core/integrations/WCSConnector.ts',
    status: 'dormant',
    reason: 'WCS connector returns success without a real network call.',
    patterns: [/Mock/i, /return true/i, /orders@wcspermits\.com/i]
  },
  {
    file: 'core/integrations/BuildASignConnector.ts',
    status: 'dormant',
    reason: 'BuildASign connector uses mock URL/order behavior.',
    patterns: [/Mock URL/i, /Connector is dormant/i, /ORD-\$\{Date\.now\(\)\}/i]
  },
  {
    file: 'core/integrations/RapidPayConnector.ts',
    status: 'dormant',
    reason: 'RapidPay connector uses mock payout/card behavior.',
    patterns: [/Mock API Call/i, /CARD-\$\{provider\.id/i, /Connector.*dormant/i]
  }
];

let failures = [];

for (const check of CHECKS) {
  const abs = resolve(ROOT, check.file);
  if (!existsSync(abs)) {
    failures.push({ ...check, found: 'missing_file' });
    continue;
  }
  const text = readFileSync(abs, 'utf8');
  const hits = check.patterns.filter((p) => p.test(text)).map(String);
  if (hits.length) {
    failures.push({ ...check, found: hits });
  }
}

if (failures.length) {
  console.error('\n❌ Mock-to-live audit failed. Production-risk scaffolding remains:\n');
  for (const f of failures) {
    console.error(`- ${f.file} [${f.status}]`);
    console.error(`  ${f.reason}`);
    console.error(`  Hits: ${Array.isArray(f.found) ? f.found.join(', ') : f.found}`);
  }
  console.error('\nFix by wiring to live Supabase/API data, gating behind dev-only mode, or removing from production routes.\n');
  process.exit(1);
}

console.log('✅ Mock-to-live audit passed. No high-risk mock patterns found.');
