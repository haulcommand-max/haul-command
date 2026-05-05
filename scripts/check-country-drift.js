#!/usr/bin/env node
/**
 * scripts/check-country-drift.js
 *
 * Pre-commit / CI guard that prevents "57 countries" scope drift from
 * re-entering live application surfaces.
 *
 * Haul Command operates across 120 countries. Any "57 countries" reference
 * in shipped code (UI, server libs, components, public content) is stale
 * legacy drift and must not return. Historical artifacts in migrations,
 * planning docs, and archived scripts are intentionally NOT scanned —
 * the goal is to prevent regressions in live surfaces, not rewrite history.
 *
 * Usage:
 *   node scripts/check-country-drift.js
 *
 * Exit codes:
 *   0 — clean (no drift in scanned paths)
 *   1 — drift detected (lists offending file:line)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths that ship to users / Google. These MUST stay on the 120-country scope.
const SCAN_PATHS = ['app', 'components', 'lib', 'pages'];

// File extensions worth scanning for drift in user-visible / runtime code.
const EXTS = ['tsx', 'ts', 'jsx', 'js', 'mdx'];

// Known stale phrases. Keep the list small and high-signal — vague matches
// like the bare number "57" generate too much noise to act on.
const DRIFT_PATTERNS = [
  /57\s*countries/gi,
  /57[\s-]country/gi,
  /across\s+57\b/gi,
];

// Allowlist: paths under SCAN_PATHS that intentionally contain the legacy
// reference (e.g. a SQL migration co-located in lib/db). Add sparingly —
// the default answer to drift is "fix it," not "allowlist it."
const ALLOWLIST = [
  // Historical SQL migration kept verbatim for replay parity.
  'lib/db/migrations/00_global_route_intelligence_unified.sql',
];

const repoRoot = process.cwd();
const findings = [];

function scanFile(rel) {
  if (ALLOWLIST.includes(rel)) return;
  let content;
  try {
    content = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  } catch {
    return;
  }
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const pattern of DRIFT_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        findings.push({
          file: rel,
          line: idx + 1,
          excerpt: line.trim().slice(0, 160),
        });
        return;
      }
    }
  });
}

function listFiles(dir) {
  // git ls-files keeps the scan honest: only tracked files, no node_modules,
  // no build output, fast even on large trees.
  try {
    const out = execSync(`git ls-files -- "${dir}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((f) => EXTS.includes(path.extname(f).slice(1).toLowerCase()));
  } catch {
    return [];
  }
}

for (const dir of SCAN_PATHS) {
  if (!fs.existsSync(path.join(repoRoot, dir))) continue;
  for (const file of listFiles(dir)) {
    scanFile(file);
  }
}

if (findings.length === 0) {
  console.log('OK — no 57-country drift in live source paths (' + SCAN_PATHS.join(', ') + ').');
  process.exit(0);
}

console.error('');
console.error('FAIL — 57-country drift detected in live source paths.');
console.error('Haul Command is a 120-country platform. Update the references below to');
console.error('"120 countries" (or remove the country count if the surface should be');
console.error('country-agnostic). See CLAUDE.md section "120-Country Standard".');
console.error('');
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.excerpt}`);
}
console.error('');
console.error(`Total drift hits: ${findings.length}`);
console.error('');
console.error('If a hit is intentional historical content, add the path to ALLOWLIST');
console.error('in scripts/check-country-drift.js with a one-line justification.');
process.exit(1);
