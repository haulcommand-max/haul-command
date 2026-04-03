// scripts/fix-inline-style-dupes.mjs
// Fixes inline style={{ key: a, ..., key: b }} on a single line
// Strategy: parse each style block, deduplicate by keeping LAST value for each key
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  'app/(app)/loads/post/page.tsx',
  'app/(app)/map/jurisdiction/page.tsx',
  'app/(public)/infrastructure/page.tsx',
  'app/(public)/tools/permit-calculator/page.tsx',
  'app/admin/ads/campaigns/create/page.tsx',
  'app/tools/permit-filing/page.tsx',
  'app/training/[slug]/_ModuleDetail.tsx',
  'components/comms/QuickCallBar.tsx',
  'components/dashboard/RepositionRadarCard.tsx',
  'components/directory/PublicDirectory.tsx',
  'components/dispatch/AvailabilityWidget.tsx',
  'components/dispatch/DispatchNotificationCenter.tsx',
  'components/hc-route/HazardReportForm.tsx',
  'components/map/CorridorLiquidityHeatmap.tsx',
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

// This regex matches style={{ ... }} blocks on a single line
// We'll use a stateful approach to handle balanced braces
function fixInlineStyleDupes(content) {
  let changed = false;
  let result = '';
  let i = 0;

  while (i < content.length) {
    // Look for style={{
    const startMatch = content.indexOf('style={{', i);
    if (startMatch === -1) {
      result += content.slice(i);
      break;
    }
    result += content.slice(i, startMatch);

    // Find matching }}
    let depth = 0;
    let j = startMatch + 'style={{'.length - 2; // at first {
    let end = -1;
    while (j < content.length) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') {
        depth--;
        if (depth === 0) { end = j + 1; break; }
      }
      j++;
    }
    if (end === -1) { result += content.slice(startMatch); break; }

    const block = content.slice(startMatch, end); // e.g. style={{ a: 1, b: 2, a: 3 }}
    const inner = block.slice('style={{'.length, block.length - 2); // a: 1, b: 2, a: 3

    // Tokenize CSS-like key: value pairs
    // Split by comma but respect nested parens/braces/template strings
    const tokens = splitStyleTokens(inner);

    // Build ordered map keeping LAST value for each key
    const keyOrder = [];
    const keyMap = new Map();
    for (const tok of tokens) {
      const colon = tok.indexOf(':');
      if (colon === -1) { keyOrder.push(tok); continue; }
      const key = tok.slice(0, colon).trim();
      const val = tok.slice(colon + 1);
      if (!keyMap.has(key)) keyOrder.push(key);
      keyMap.set(key, val); // always overwrite = keep last
    }

    const hasDupes = tokens.length !== keyOrder.filter(k => keyMap.has(k)).length ||
      new Set(tokens.map(t => { const c = t.indexOf(':'); return c === -1 ? t : t.slice(0,c).trim(); })).size < tokens.filter(t => t.indexOf(':') !== -1).length;

    // Reconstruct
    const newInner = keyOrder.map(k => {
      if (!keyMap.has(k)) return k; // non-key token (comments etc.)
      return `${k}:${keyMap.get(k)}`;
    }).join(',');

    const newBlock = `style={{${newInner}}}`;
    if (newBlock !== block) {
      changed = true;
    }
    result += newBlock;
    i = end;
  }

  return { result, changed };
}

function splitStyleTokens(inner) {
  // Split by comma not inside parens or template literals
  const tokens = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inString) {
      current += ch;
      if (ch === stringChar && inner[i-1] !== '\\') inString = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true; stringChar = ch; current += ch;
    } else if (ch === '(' || ch === '{' || ch === '[') {
      depth++; current += ch;
    } else if (ch === ')' || ch === '}' || ch === ']') {
      depth--; current += ch;
    } else if (ch === ',' && depth === 0) {
      tokens.push(current); current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current);
  return tokens;
}

let totalFixed = 0;
for (const rel of TARGETS) {
  const full = join(ROOT, rel);
  let content;
  try { content = readFileSync(full, 'utf8'); } catch { console.log(`  SKIP: ${rel}`); continue; }
  const { result, changed } = fixInlineStyleDupes(content);
  if (changed) {
    writeFileSync(full, result);
    console.log(`  ✅ Fixed: ${rel}`);
    totalFixed++;
  } else {
    console.log(`  -- Clean: ${rel}`);
  }
}
console.log(`\nPatched: ${totalFixed} files.`);
