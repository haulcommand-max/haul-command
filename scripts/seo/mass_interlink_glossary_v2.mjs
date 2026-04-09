#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// MASS INTERLINK GLOSSARY v2 — Multi-Surface Content Regen Pipeline
//
// Scans all public-facing pages and injects semantic hyperlinks
// from industry terms to their glossary definitions.
//
// Targets: training, tools, escort-requirements, regulations, roles
//
// Rules:
//   - Only link first occurrence per term per page
//   - Never link inside headings or existing links
//   - Sort by term length DESC to avoid partial matches
// ═══════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

const ROOT = process.cwd();

// ── 1. Load Dictionary ──────────────────────────────────────
const glossaryPath = path.join(ROOT, 'data', 'global-glossary.json');
if (!fs.existsSync(glossaryPath)) {
  console.error('❌ global-glossary.json not found at', glossaryPath);
  process.exit(1);
}

const glossaryData = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
const terms = glossaryData.haul_command_global_dictionary?.terms || [];

const replaceList = [];
for (const term of terms) {
  const eng = term.universal_en;
  if (!eng || eng.length < 4) continue; // Skip very short terms
  const slug = term.seo_slugs?.US || term.seo_slugs?.AU || eng.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  replaceList.push({ word: eng, slug });
  
  if (term.regional_translations) {
    for (const [, trans] of Object.entries(term.regional_translations)) {
      if (trans && trans !== eng && typeof trans === 'string' && trans.length >= 4) {
        replaceList.push({ word: trans, slug });
      }
    }
  }
}

// Add manual high-value terms
const MANUAL_TERMS = [
  { word: 'pilot car', slug: 'pilot-car' },
  { word: 'Pilot Car', slug: 'pilot-car' },
  { word: 'escort vehicle', slug: 'escort-vehicle' },
  { word: 'Escort Vehicle', slug: 'escort-vehicle' },
  { word: 'oversize load', slug: 'oversize-load' },
  { word: 'Oversize Load', slug: 'oversize-load' },
  { word: 'wide load', slug: 'wide-load' },
  { word: 'heavy haul', slug: 'heavy-haul' },
  { word: 'Heavy Haul', slug: 'heavy-haul' },
  { word: 'superload', slug: 'superload' },
  { word: 'Superload', slug: 'superload' },
  { word: 'MUTCD', slug: 'mutcd' },
  { word: 'frost law', slug: 'frost-law' },
  { word: 'Frost Law', slug: 'frost-law' },
  { word: 'height pole', slug: 'height-pole' },
  { word: 'route survey', slug: 'route-survey' },
  { word: 'Route Survey', slug: 'route-survey' },
  { word: 'overweight permit', slug: 'overweight-permit' },
  { word: 'axle weight', slug: 'axle-weight' },
  { word: 'escort requirements', slug: 'escort-requirements' },
];
replaceList.push(...MANUAL_TERMS);

// Sort by length DESC to prevent partial matches
replaceList.sort((a, b) => b.word.length - a.word.length);

// Deduplicate by word
const seen = new Set();
const deduped = replaceList.filter(item => {
  const key = item.word.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`📖 Loaded ${deduped.length} glossary terms for interlinking.`);

// ── 2. Find Target Files ────────────────────────────────────
const targetPatterns = [
  'app/training/page.tsx',
  'app/tools/*/page.tsx',
  'app/(public)/escort-requirements/*/page.tsx',
  'app/(public)/escort-requirements/page.tsx',
  'app/(public)/regulations/page.tsx',
  'app/(public)/glossary/page.tsx',
  'app/roles/*/page.tsx',
];

const targetFiles = fg.sync(targetPatterns, { cwd: ROOT, absolute: true });
console.log(`🎯 Found ${targetFiles.length} target files.`);

// ── 3. Interlink Engine ─────────────────────────────────────
// APPROACH: Find JSX paragraph text between >...< boundaries.
// Only inject links into visible JSX text, never into JS code.

function interlinkContent(content) {
  let linkCount = 0;
  const linkedTerms = new Set();
  let modified = content;

  for (const { word, slug } of deduped) {
    if (linkedTerms.has(word.toLowerCase())) continue;

    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Only match the term when preceded by > (end of JSX tag) and text
    // This ensures we're inside rendered JSX content, not JS code
    const jsxTextPattern = new RegExp(
      `(>(?:[^<]*?))\\b(${escapedWord})\\b`,
      'i'
    );

    const m = modified.match(jsxTextPattern);
    if (!m || m.index === undefined) continue;

    // Extra safety: check the line context
    const lineStart = modified.lastIndexOf('\n', m.index) + 1;
    const lineEnd = modified.indexOf('\n', m.index);
    const line = modified.substring(lineStart, lineEnd > 0 ? lineEnd : m.index + 200);

    // SKIP: metadata objects (description:, keywords:, title:, name:)
    if (/^\s*(description|keywords|title|name|alt)\s*[:=]/.test(line.trimStart())) continue;
    // SKIP: JS comments
    if (/^\s*\/\//.test(line.trimStart())) continue;
    // SKIP: inside string arrays ['term1', 'term2']
    if (/^\s*\[?\s*'/.test(line.trimStart())) continue;
    // SKIP: object property lines { key: 'value' }
    if (/^\s*\{?\s*\w+:\s*['"]/.test(line.trimStart())) continue;
    // SKIP: JSON-LD or dangerouslySetInnerHTML
    if (/dangerouslySetInnerHTML|application\/ld\+json|JSON\.stringify/.test(line)) continue;
    // SKIP: import/export lines
    if (/^\s*(import|export|const|let|var|function)\s/.test(line.trimStart())) continue;
    // SKIP: if no JSX tag opener found on this line (pure JS code line)
    if (!/</.test(line) && !/>\s*$/.test(modified.substring(lineStart - 200, lineStart))) continue;

    // Build the replacement — keep the prefix (>text before match) intact
    const prefix = m[1];
    const matched = m[2];
    const fullMatchStart = m.index;
    const fullMatchEnd = m.index + m[0].length;

    const link = `<a href="/glossary/${slug}" style={{color: '#D4A844', textDecoration: 'none', borderBottom: '1px dotted rgba(212,168,68,0.3)'}}>${matched}</a>`;

    modified = modified.substring(0, fullMatchEnd - matched.length) + link + modified.substring(fullMatchEnd);
    linkedTerms.add(word.toLowerCase());
    linkCount++;
  }

  return { content: modified, linkCount };
}

// ── 4. Process Files ────────────────────────────────────────
let totalLinks = 0;
let filesModified = 0;

for (const filePath of targetFiles) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { content: modified, linkCount } = interlinkContent(original);

  if (linkCount > 0) {
    fs.writeFileSync(filePath, modified);
    const relative = path.relative(ROOT, filePath);
    console.log(`  ✅ ${relative}: ${linkCount} terms linked`);
    totalLinks += linkCount;
    filesModified++;
  }
}

console.log(`\n🔗 COMPLETE: ${totalLinks} glossary links injected across ${filesModified} files.`);
console.log(`⚠️  Run 'npm run build' to verify no JSX syntax breakage.`);

