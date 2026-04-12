const fs = require('fs');

// === FIX 1: Training page — strip ALL remaining mojibake ===
let page = fs.readFileSync('app/training/page.tsx', 'utf8');

// Remove ALL garbled emoji prefixes globally
// Pattern: any sequence of 2-8 non-ASCII latin-like chars followed by a space before known words
// Specific known garbled strings:
page = page.replace(/ðŸŽ" /g, '');       // garbled graduation cap
page = page.replace(/ðŸ›¡ï¸ /g, '');      // garbled shield
page = page.replace(/â†"/g, '');          // garbled down arrow  
page = page.replace(/â†'/g, '');          // garbled right arrow
page = page.replace(/â­ /g, '');          // garbled star
page = page.replace(/â€"/g, '\u2014');    // garbled em-dash -> real em-dash

// Also strip the mr-2 class since we removed the icon prefix text collision
page = page.replace(/<ShieldCheck className="w-4 h-4 mr-2" \/>/g, '<ShieldCheck className="w-4 h-4" />');

fs.writeFileSync('app/training/page.tsx', page, 'utf8');
console.log('[1/4] Training page: all mojibake stripped');

// === FIX 2: Kill GlobalNavOverlay — the redundant fixed pill ===
// Replace the component with a no-op so it renders nothing
const navContent = `'use client';

// GlobalNavOverlay removed — the navbar already handles the home link.
// This fixed pill was redundant and occluded the page content.
export function GlobalNavOverlay() {
  return null;
}
`;
fs.writeFileSync('components/layout/GlobalNavOverlay.tsx', navContent, 'utf8');
console.log('[2/4] GlobalNavOverlay: killed (returns null)');

// === FIX 3: globals.css — add html background + lighten --hc-bg ===
let css = fs.readFileSync('app/globals.css', 'utf8');

// Change --hc-bg from #0B0B0C to #0F1318
css = css.replace(/--hc-bg:\s*#0B0B0C;/, '--hc-bg: #0F1318;');

// Add background-color to html element
// The existing html rule at line ~213 doesn't have a background
css = css.replace(
  /html \{\n\s*font-size: 16px;/,
  'html {\n  background-color: #0F1318;\n  font-size: 16px;'
);

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('[3/4] globals.css: html bg=#0F1318, --hc-bg lightened');

// === FIX 4: FAQ — render expanded by default for SEO weight ===
let faq = fs.readFileSync('components/training/FAQAccordion.tsx', 'utf8');

// Change default state from null (all closed) to 0 (first open), 
// but better: make ALL expanded by default. 
// Change the initial state to include all indices, and toggle individually.
const newFaq = `'use client';

import { useState } from 'react';

export function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  // Start with ALL items expanded for SEO crawlability and content weight
  const [closedIndices, setClosedIndices] = useState<Set<number>>(new Set());

  if (!faqs || faqs.length === 0) return null;

  const toggle = (i: number) => {
    setClosedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {faqs.map((faq, i) => {
        const isOpen = !closedIndices.has(i);
        return (
          <div
            key={i}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
              transition: 'border-color 0.2s ease',
            }}
          >
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              aria-expanded={isOpen}
            >
              <h3
                itemProp="name"
                style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.4 }}
              >
                {faq.q}
              </h3>
              <span
                style={{
                  color: '#F5A623',
                  fontSize: 22,
                  marginLeft: 16,
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                +
              </span>
            </button>
            <div
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
              style={{
                padding: isOpen ? '0 24px 24px 24px' : '0 24px',
                maxHeight: isOpen ? 500 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.25s ease, padding 0.3s ease',
              }}
            >
              <p
                itemProp="text"
                style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.7, margin: 0 }}
              >
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
`;
fs.writeFileSync('components/training/FAQAccordion.tsx', newFaq, 'utf8');
console.log('[4/4] FAQAccordion: all items expanded by default');

// === FIX 3b: layout.tsx — update inline bg to match new --hc-bg ===
let layout = fs.readFileSync('app/layout.tsx', 'utf8');
layout = layout.replace("background: '#0B0B0C'", "background: '#0F1318'");
fs.writeFileSync('app/layout.tsx', layout, 'utf8');
console.log('[+] layout.tsx: inline body bg updated to #0F1318');

console.log('\nAll 4 fixes applied. Ready to commit.');
