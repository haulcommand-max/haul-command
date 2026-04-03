// scripts/fix-style-dupes.mjs — removes duplicate keys from JSX style objects
// Strategy: In a duplicate pair, keep the LAST occurrence (the intentional override)
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Map of file -> list of { lineHint, dupeKeys }
// lineHint is approximate (1-indexed) from audit output
const TARGETS = [
  'app/(app)/loads/post/page.tsx',
  'app/(app)/map/jurisdiction/page.tsx',
  'app/(public)/infrastructure/page.tsx',
  'app/(public)/tools/permit-calculator/page.tsx',
  'app/admin/ads/campaigns/create/page.tsx',
  'app/tools/global-command-map/page.tsx',
  'app/tools/permit-filing/page.tsx',
  'app/training/[slug]/_ModuleDetail.tsx',
  'components/capture/CaptureOverlay.tsx',
  'components/comms/QuickCallBar.tsx',
  'components/dashboard/RepositionRadarCard.tsx',
  'components/directory/PublicDirectory.tsx',
  'components/dispatch/AvailabilityWidget.tsx',
  'components/dispatch/DispatchNotificationCenter.tsx',
  'components/hc-route/HazardReportForm.tsx',
  'components/map/CorridorLiquidityHeatmap.tsx',
  'components/map/JurisdictionMap.tsx',
  'components/map/SmallStatesSidebar.tsx',
  'components/map/USCanadaHubMap.tsx',
  'components/maps/NorthAmericaMap.tsx',
  'components/mobile/screens/ChooseYourLane.tsx',
  'components/monetization/SmartPaywallBanner.tsx',
  'components/search/SearchIntentModules.tsx',
  'components/social/BadgeProgressRail.tsx',
  'components/training/AssessmentPlayer.tsx',
  'components/ui/HubMap.tsx',
];

let totalFixed = 0;

function removeDuplicateStyleKeys(content) {
  // Match style={{ ... }} blocks — handles multi-line up to ~20 lines
  const STYLE_BLOCK = /style=\{\{([\s\S]*?)\}\}/g;
  let changed = false;

  const result = content.replace(STYLE_BLOCK, (fullMatch, inner) => {
    // Find all key: value pairs within the block
    // We process line by line to remove the FIRST duplicate, keep the LAST
    const lines = inner.split('\n');
    const seenKeys = new Map(); // key -> array of line indices where it appears
    const keyRe = /^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/;

    // First pass: record all key occurrences
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(keyRe);
      if (m) {
        const key = m[1];
        if (!seenKeys.has(key)) seenKeys.set(key, []);
        seenKeys.get(key).push(i);
      }
    }

    // Second pass: remove earlier occurrences of duplicate keys
    const linesToRemove = new Set();
    for (const [, indices] of seenKeys) {
      if (indices.length > 1) {
        // Keep only last, remove all earlier
        for (let i = 0; i < indices.length - 1; i++) {
          linesToRemove.add(indices[i]);
        }
      }
    }

    if (linesToRemove.size === 0) return fullMatch;

    changed = true;
    const newInner = lines
      .filter((_, i) => !linesToRemove.has(i))
      .join('\n');
    return `style={{${newInner}}}`;
  });

  return { result, changed };
}

for (const rel of TARGETS) {
  const full = join(ROOT, rel);
  let content;
  try {
    content = readFileSync(full, 'utf8');
  } catch {
    console.log(`  SKIP (not found): ${rel}`);
    continue;
  }

  const { result, changed } = removeDuplicateStyleKeys(content);
  if (changed) {
    writeFileSync(full, result);
    console.log(`  ✅ Fixed: ${rel}`);
    totalFixed++;
  } else {
    console.log(`  -- No dupes found (may be inline, not multiline): ${rel}`);
  }
}

console.log(`\nTotal files patched: ${totalFixed}`);
console.log('Note: Inline same-line dupes need manual review — run audit again to verify.');
