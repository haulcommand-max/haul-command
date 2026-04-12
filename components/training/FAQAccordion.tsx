"use client";

import { useState } from 'react';

export function FAQAccordion({ faqs }: { faqs: { q: string, a: string }[] }) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <>
      {faqs.map((faq, i) => (
        <div key={i} style={{
          background: expandedFaq === i ? '#111118' : 'transparent',
          border: '1px solid',
          borderColor: expandedFaq === i ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          marginBottom: 10,
          overflow: 'hidden',
          transition: 'all 0.2s',
        }}>
          <button
            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '18px 20px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              color: 'inherit',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15, color: expandedFaq === i ? '#F5A623' : '#e8e8e8', lineHeight: 1.4 }}>
              {faq.q}
            </span>
            <span style={{
              color: '#F5A623', fontSize: 20, flexShrink: 0,
              transform: expandedFaq === i ? 'rotate(45deg)' : 'none',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>+</span>
          </button>
          {expandedFaq === i && (
            <div style={{
              padding: '0 20px 20px',
              fontSize: 14, lineHeight: 1.7, color: '#8a8a9a',
            }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
