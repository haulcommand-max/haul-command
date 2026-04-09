import fs from 'fs';
import path from 'path';

// 1. Load Dictionary
const glossaryPath = path.join(process.cwd(), 'data', 'global-glossary.json');
const glossaryData = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
const terms = glossaryData.haul_command_global_dictionary.terms;

const replaceList = [];
for (const term of terms) {
  const eng = term.universal_en;
  const slug = term.seo_slugs?.US || term.seo_slugs?.AU || eng.toLowerCase().replace(/\s+/g, '-');
  replaceList.push({ word: eng, slug });
  
  if (term.regional_translations) {
    for (const [region, trans] of Object.entries(term.regional_translations)) {
      if (trans && trans !== eng) {
        replaceList.push({ word: trans, slug });
      }
    }
  }
}

replaceList.push({ word: 'Pilot car', slug: 'pilot-car' });
replaceList.push({ word: 'pilot car', slug: 'pilot-car' });
replaceList.push({ word: 'Haul Command', slug: 'haul-command' });
replaceList.push({ word: 'Heavy Haul', slug: 'heavy-haul' });
replaceList.sort((a, b) => b.word.length - a.word.length);

const pagePath = path.join(process.cwd(), 'app', 'training', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

function interlinkString(text) {
  let result = text;
  
  // Create a placeholder map so we don't double replace
  const placeholders = {};
  let pIdx = 0;
  
  for (const { word, slug } of replaceList) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    result = result.replace(regex, (match) => {
      const p = `__PLACEHOLDER_${pIdx++}__`;
      placeholders[p] = `<a href="/glossary/${slug}" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.5);">${match}</a>`;
      return p;
    });
  }
  
  // Restore placeholders
  for (const p of Object.keys(placeholders)) {
    result = result.replace(new RegExp(p, 'g'), placeholders[p]);
  }
  
  return result;
}

// Ensure the page doesn't use <details> for FAQS anymore
content = content.replace(/<details key=\{i\} style=\{\{(.*?)\}\}>/g, "<div key={i} style={{$1}}>");
content = content.replace(/<\/details>/g, "</div>");
content = content.replace(/<summary style=\{\{ padding: '16px 18px', cursor: 'pointer', (.*?)\}\}>/g, "<h3 style={{ padding: '16px 18px', $1 }}>");
content = content.replace(/<\/summary>/g, "</h3>");
content = content.replace(/<span style=\{\{ color: gold, flexShrink: 0 \}\}>\+<\/span>/g, "<span style={{ color: gold, flexShrink: 0 }}>■</span>");
content = content.replace(/<p style=\{\{ padding: '0 18px 16px', margin: 0, fontSize: 13, color: 'rgba\(255,255,255,0\.6\)', lineHeight: 1\.7, borderTop: '1px solid rgba\(255,255,255,0\.05\)' \}\}>\s*\{faq\.a\}\s*<\/p>/g, "<p style={{ padding: '16px 18px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}><span dangerouslySetInnerHTML={{ __html: faq.a }} /></p>");


content = content.replace(
  /<p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', lineHeight: 1\.6 }}>{m\.description}<\/p>/g,
  `<p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: m.description }} />`
);

// We need to parse block by block to not mess up JS code. 
// Match strings in `a: '...'` properly.
content = content.replace(/^(\s+)a:\s*'([^']+)'/gm, (match, space, p1) => {
  return `${space}a: '${interlinkString(p1)}'`;
});

content = content.replace(/^(\s+)description:\s*'([^']+)'/gm, (match, space, p1) => {
  // We only want to target descriptions inside MODULES, which have 6 spaces of indent
  if (space.length === 6) {
    return `${space}description: '${interlinkString(p1)}'`;
  }
  return match;
});

fs.writeFileSync(pagePath, content);
console.log('Mass interlinking complete for /app/training/page.tsx.');
