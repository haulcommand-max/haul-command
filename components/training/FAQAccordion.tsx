'use client';

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
