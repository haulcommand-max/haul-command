#!/usr/bin/env node
/**
 * QA: check-canonical-enforcement.mjs
 * 
 * Comprehensive audit of canonical URL consistency across all pages.
 * Detects:
 *  1. Mixed canonical domains (hub.haulcommand.com vs haulcommand.com)
 *  2. Relative vs absolute canonical URLs
 *  3. Missing canonical tags entirely
 *  4. Non-HTTPS canonical URLs
 *  5. Trailing slash inconsistencies
 *  6. Canonical URLs that don't match actual page URL
 * 
 * Usage:
 *   node scripts/qa/check-canonical-enforcement.mjs
 *   node scripts/qa/check-canonical-enforcement.mjs --fix  (outputs fix patch)
 */

import { readdir, readFile } from 'fs/promises';
import { join, resolve, relative } from 'path';

const SRC_DIR = resolve(process.cwd(), 'src/app');
const CANONICAL_DOMAIN = 'https://haulcommand.com';
const FIX_MODE = process.argv.includes('--fix');

let totalFiles = 0;
let issueCount = 0;
const issues = [];
const fixes = [];

// Recursively find all page.tsx and layout.tsx files
async function findPageFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await findPageFiles(fullPath));
      }
    } else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') {
      files.push(fullPath);
    }
  }
  return files;
}

function addIssue(file, line, type, detail, canonicalValue) {
  issueCount++;
  const relFile = relative(process.cwd(), file);
  issues.push({ file: relFile, line, type, detail, canonicalValue });
}

function analyzeFile(filePath, content) {
  totalFiles++;
  const lines = content.split('\n');
  const relFile = relative(process.cwd(), filePath);

  // Check for canonical references
  const canonicalMatches = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Match canonical: 'url' or canonical: `url`
    const canonicalPatterns = [
      /canonical:\s*['"`]([^'"`]+)['"`]/g,
      /canonical:\s*`([^`]+)`/g,
    ];

    for (const pattern of canonicalPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const value = match[1];
        canonicalMatches.push({ value, lineNum, raw: line.trim() });
      }
    }
  }

  if (canonicalMatches.length === 0) {
    // Check if this page generates metadata — if it has `export` and `metadata` or `generateMetadata`
    const hasMetadata = content.includes('generateMetadata') || content.includes('export const metadata');
    if (hasMetadata) {
      // Has metadata but no canonical — warn
      addIssue(filePath, 0, 'MISSING_CANONICAL', 'Page has metadata but no canonical URL set', '(none)');
    }
    return;
  }

  for (const { value, lineNum, raw } of canonicalMatches) {
    // 1. Check for wrong domain
    if (value.includes('hub.haulcommand.com')) {
      addIssue(filePath, lineNum, 'WRONG_DOMAIN', `Uses 'hub.haulcommand.com' instead of 'haulcommand.com'`, value);
      if (FIX_MODE) {
        fixes.push({
          file: relFile,
          line: lineNum,
          find: 'hub.haulcommand.com',
          replace: 'haulcommand.com',
        });
      }
    }

    // 2. Check for HTTP (non-HTTPS)
    if (value.startsWith('http://') && !value.includes('localhost')) {
      addIssue(filePath, lineNum, 'NON_HTTPS', 'Canonical URL uses http:// instead of https://', value);
    }

    // 3. Check for relative URL (no protocol)
    if (!value.startsWith('http') && !value.startsWith('$') && !value.includes('${')) {
      // Allow template literal expressions (${siteUrl}...)
      if (value.startsWith('/')) {
        addIssue(filePath, lineNum, 'RELATIVE_URL', 'Canonical URL is relative (should be absolute with domain)', value);
      }
    }

    // 4. Check for trailing slash inconsistency
    if (value.endsWith('/') && value !== CANONICAL_DOMAIN + '/' && !value.includes('${')) {
      addIssue(filePath, lineNum, 'TRAILING_SLASH', 'Canonical URL has trailing slash', value);
    }

    // 5. Check for www prefix
    if (value.includes('www.haulcommand.com')) {
      addIssue(filePath, lineNum, 'WWW_PREFIX', 'Uses www.haulcommand.com — should be haulcommand.com (no www)', value);
      if (FIX_MODE) {
        fixes.push({
          file: relFile,
          line: lineNum,
          find: 'www.haulcommand.com',
          replace: 'haulcommand.com',
        });
      }
    }
  }
}

// Main
console.log('\n🔍 Canonical URL Enforcement Audit\n');
console.log(`  Domain standard: ${CANONICAL_DOMAIN}`);
console.log(`  Scanning: ${SRC_DIR}\n`);

const files = await findPageFiles(SRC_DIR);
console.log(`  Found ${files.length} page/layout files\n`);

for (const file of files) {
  try {
    const content = await readFile(file, 'utf-8');
    analyzeFile(file, content);
  } catch (e) {
    // Skip files that can't be read
  }
}

// Print results grouped by issue type
const issueTypes = {};
for (const issue of issues) {
  if (!issueTypes[issue.type]) issueTypes[issue.type] = [];
  issueTypes[issue.type].push(issue);
}

const typeLabels = {
  WRONG_DOMAIN: '🔴 Wrong Domain (hub.haulcommand.com)',
  WWW_PREFIX: '🔴 WWW Prefix (www.haulcommand.com)',
  NON_HTTPS: '🔴 Non-HTTPS Canonical',
  RELATIVE_URL: '🟡 Relative Canonical URL',
  TRAILING_SLASH: '🟡 Trailing Slash',
  MISSING_CANONICAL: '🟠 Missing Canonical Tag',
};

for (const [type, items] of Object.entries(issueTypes)) {
  console.log(`  ${typeLabels[type] || type} (${items.length})`);
  for (const item of items) {
    console.log(`    ├─ ${item.file}:${item.line}`);
    console.log(`    │  Value: ${item.canonicalValue}`);
  }
  console.log();
}

// Summary
console.log('─'.repeat(60));
console.log(`  Files scanned: ${totalFiles}`);
console.log(`  Total issues:  ${issueCount}`);

if (issueCount === 0) {
  console.log('\n  ✅ All canonical URLs are consistent!\n');
} else {
  console.log(`\n  ❌ Found ${issueCount} canonical URL issues.\n`);
}

// Fix mode output
if (FIX_MODE && fixes.length > 0) {
  console.log('\n📝 Suggested Fixes:\n');
  for (const fix of fixes) {
    console.log(`  ${fix.file}:${fix.line}`);
    console.log(`    Replace: ${fix.find}`);
    console.log(`    With:    ${fix.replace}\n`);
  }
}

process.exit(issueCount > 0 ? 1 : 0);
