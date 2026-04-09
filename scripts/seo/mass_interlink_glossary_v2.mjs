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

function interlinkContent(content, filePath) {
  let modified = content;
  let linkCount = 0;
  const linkedTerms = new Set();
  
  for (const { word, slug } of deduped) {
    if (linkedTerms.has(word.toLowerCase())) continue;
    
    // Only match inside string literals (single-quoted JSX content)
    // Pattern: word boundary match, case-insensitive, first occurrence only
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![<\\/a-zA-Z"=])\\b(${escapedWord})\\b(?![^<]*<\\/a>)(?![^<]*<\\/h[1-3]>)`, 'i');
    
    // Only replace inside text content strings (not in JSX attributes or code)
    const match = modified.match(regex);
    if (match && match.index !== undefined) {
      // Verify we're inside a string literal or text content, not in a tag attribute
      const before = modified.substring(Math.max(0, match.index - 100), match.index);
      const isInsideTag = /<[a-zA-Z][^>]*$/.test(before);
      const isInsideHref = /href=["'][^"']*$/.test(before);
      const isInsideExistingLink = /<a [^>]*$/.test(before);
      
      if (!isInsideTag && !isInsideHref && !isInsideExistingLink) {
        const link = `<a href="/glossary/${slug}" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">${match[0]}</a>`;
        modified = modified.substring(0, match.index) + link + modified.substring(match.index + match[0].length);
        linkedTerms.add(word.toLowerCase());
        linkCount++;
      }
    }
  }
  
  return { content: modified, linkCount };
}

// ── 4. Process Files ────────────────────────────────────────
let totalLinks = 0;
let filesModified = 0;

for (const filePath of targetFiles) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { content: modified, linkCount } = interlinkContent(original, filePath);
  
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
