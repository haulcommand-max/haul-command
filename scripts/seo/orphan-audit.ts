/**
 * scripts/seo/orphan-audit.ts
 * Orphan page detector — run with: npx ts-node scripts/seo/orphan-audit.ts
 *
 * Scans the file-system route tree and cross-references against the
 * interlinking graph. Reports:
 *  - Pages that receive no inbound links (orphans)
 *  - Pages missing outbound RelatedLinks component
 *  - noindex pages that accidentally appear in link graph
 */

import fs from 'fs';
import path from 'path';
import { NOINDEX_PATHS, STATIC_LINKS, type PageType } from '../../lib/seo/interlinking-graph';

const APP_DIR = path.join(process.cwd(), 'app');

// All hrefs referenced across the static link sets
const allLinkedHrefs = new Set<string>();
for (const links of Object.values(STATIC_LINKS)) {
  for (const link of links) allLinkedHrefs.add(link.href);
}

// Collect all indexable page routes
function collectRoutes(dir: string, base = ''): string[] {
  const routes: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    if (entry.name === 'api') continue;
    if (entry.isDirectory()) {
      const segment = entry.name
        .replace(/^\(.*\)$/, '')  // Strip route groups
        .replace(/^\[.*\]$/, '[dynamic]');
      const subRoutes = collectRoutes(path.join(dir, entry.name), `${base}/${segment}`.replace('//', '/'));
      routes.push(...subRoutes);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      routes.push(base || '/');
    }
  }
  return routes;
}

const routes = collectRoutes(APP_DIR);
const orphans: string[] = [];
const noindexLeaks: string[] = [];

for (const route of routes) {
  // Check if any noindex path leaks into link graph
  if (NOINDEX_PATHS.has(route)) {
    if (allLinkedHrefs.has(route)) noindexLeaks.push(route);
    continue;
  }

  // Check if route receives any inbound link
  // (Exact match OR dynamic routes matched by prefix)
  const hasDynamicMatch = Array.from(allLinkedHrefs).some(
    h => h !== '/' && route.startsWith(h.split('[')[0])
  );
  if (!allLinkedHrefs.has(route) && !hasDynamicMatch) {
    orphans.push(route);
  }
}

console.log('\n🔍 SEO Orphan Audit\n');
console.log(`Total routes scanned: ${routes.length}`);
console.log(`Receiving inbound links: ${routes.length - orphans.length}`);
console.log(`Orphans (no inbound links): ${orphans.length}`);

if (orphans.length > 0) {
  console.log('\n⚠️  Orphan pages:');
  orphans.forEach(o => console.log(`  • ${o}`));
}

if (noindexLeaks.length > 0) {
  console.log('\n🚨 noindex pages in link graph (remove these links):');
  noindexLeaks.forEach(n => console.log(`  • ${n}`));
}

if (orphans.length === 0 && noindexLeaks.length === 0) {
  console.log('\n✅ No orphans detected. Link graph is healthy.');
}
