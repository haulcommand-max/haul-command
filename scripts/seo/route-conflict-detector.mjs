#!/usr/bin/env node
/**
 * Haul Command — Route Conflict Detector (Phase 1)
 *
 * Scans the Next.js `app/` directory and logs any overlapping dynamic routes
 * that might cause URL collision or cannibalization.
 * Used as a pre-build check.
 */

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
const { globSync } = fg;

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');

function scanRoutes() {
    const pageFiles = globSync('**/*/page.tsx', { cwd: APP_DIR, absolute: true });

    const routePatterns = pageFiles.map((file) => {
        let route = file.replace(APP_DIR.replace(/\\/g, '/'), '').replace(/\/page\.tsx$/, '') || '/';
        // Remove group directories like (public), (admin), etc.
        route = route.replace(/\/\([^)]+\)/g, '');
        return route === '' ? '/' : route;
    });

    console.log(`[seo:detector] Found ${routePatterns.length} page routes...`);

    const warnings = [];
    const errors = [];

    // Rule 1: Flat dynamic [slug] at the root vs specific prefixes
    const rootDynamic = routePatterns.find(r => r === '/[slug]' || r === '/[country]' || r === '/[id]');
    if (rootDynamic) {
        const flatPrefixes = routePatterns.filter(r => r !== rootDynamic && r.startsWith('/') && r.split('/').length === 2 && !r.includes('['));
        if (flatPrefixes.length > 0) {
            warnings.push(`\n⚠ Overlap Warning: Next.js evaluates static routes first, but '${rootDynamic}' acts as a root wildcard catch-all. Avoid creating folders matching dynamic values (e.g. creating /us as a static folder vs /[country]).`);
        }
    }

    // Rule 2: Country hubs vs Directory country hubs
    const hasCountryHub = routePatterns.some(r => r === '/[country]');
    const hasDirCountryHub = routePatterns.some(r => r === '/directory/[country]');
    if (hasCountryHub && hasDirCountryHub) {
        errors.push(`\n✗ Canonical Violation: '/[country]' and '/directory/[country]' both exist. You must pick one canonical path for the country hub to avoid split PageRank.`);
    }

    // Rule 3: City hiring hubs vs Pilot Car state
    const hasCityHub = routePatterns.some(r => r.match(/\/\[country\]\/\[.+\]\/pilot-car-services/));
    const hasPilotCarState = routePatterns.some(r => r === '/pilot-car/[state]');
    if (hasCityHub && hasPilotCarState) {
        errors.push(`\n✗ Canonical Violation: Nested city hiring ('/[country]/[city]/pilot-car-services') conflicts with legacy ('/pilot-car/[state]').`);
    }

    if (warnings.length > 0) {
        console.warn(`\n[seo:detector] ⚠️ WARNINGS LINTED:`);
        warnings.forEach(w => console.warn(w));
    }

    if (errors.length > 0) {
        console.error(`\n[seo:detector] 🚨 CONFLICTS DETECTED:`);
        errors.forEach(e => console.error(e));
        console.error('\n[seo:detector] ❌ Fix routing authority before allowing the build to proceed.\n');
        process.exit(1);
    } else {
        console.log(`\n[seo:detector] ✅ Clean matrix. No hard canonical route cannibalization detected.\n`);
    }
}

scanRoutes();
