const fs = require('fs');

// 1. Fix GlobalNavOverlay to use Next.js Image for the Logo
let nav = fs.readFileSync('components/layout/GlobalNavOverlay.tsx', 'utf8');

if (!nav.includes('import Image')) {
    nav = nav.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport Image from 'next/image';");
}

let newLinkStyle = `<Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
      }}
      >
        <Image src="/haul-command-logo.svg" alt="Haul Command" width={40} height={40} className="w-10 h-10 object-contain" onError={(e: any) => { e.currentTarget.src = '/icon.png'; }} /> 
        <span style={{ marginLeft: 12, fontWeight: 800, fontSize: 18, letterSpacing: '0.05em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>HAUL COMMAND</span>
      </Link>`;

nav = nav.replace(/<Link href="\/" style=\{\{[\s\S]*?<\/Link>/, newLinkStyle);
fs.writeFileSync('components/layout/GlobalNavOverlay.tsx', nav);

// 2. Fix FAQAccordion to be standard div structurally mapped, not hidden behind native details that some custom CSS might obscure.
// Wait, the user specifically wants standard <h3> and <p> tags.
let faq = fs.readFileSync('components/training/FAQAccordion.tsx', 'utf8');

const newFaqContent = `'use client';

import { useState } from 'react';

export function FAQAccordion({ faqs }: { faqs: { q: string, a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
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
              transition: 'all 0.2s ease'
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
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
              <h3 itemProp="name" style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                {faq.q}
              </h3>
              <span style={{ 
                color: '#F5A623', 
                fontSize: 24, 
                marginLeft: 16,
                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
                lineHeight: 1
              }}>
                +
              </span>
            </button>
            <div 
              itemScope 
              itemProp="acceptedAnswer" 
              itemType="https://schema.org/Answer"
              style={{
                padding: isOpen ? '0 24px 24px 24px' : '0 24px',
                maxHeight: isOpen ? 1000 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <p itemProp="text" style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
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

fs.writeFileSync('components/training/FAQAccordion.tsx', newFaqContent);
console.log('Fixed Nav and FAQ Components.');
