import { CSSProperties } from 'react';

export function FAQAccordion({ faqs }: { faqs: { q: string, a: string }[] }) {
  // Using native HTML details/summary elements to ensure 
  // SEO bots can crawl the answers without executing Javascript
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {faqs.map((faq, i) => (
        <details
          key={i}
          className="faq-details"
          style={{
            background: 'rgba(17,17,24,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          } as CSSProperties}
        >
          <summary
            className="faq-summary"
            style={{
              padding: '18px 20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16,
              color: '#e8e8e8',
              lineHeight: 1.4,
              listStyle: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            } as CSSProperties}
          >
            <span>{faq.q}</span>
            <span className="faq-icon" style={{ color: '#F5A623', flexShrink: 0, fontWeight: 'bold' }}>↓</span>
          </summary>
          <div style={{ padding: '0 20px 20px', fontSize: 15, lineHeight: 1.7, color: '#e2e8f0' }}>
            {faq.a}
          </div>
        </details>
      ))}
      <style>{`
        .faq-details > summary::-webkit-details-marker {
          display: none;
        }
        .faq-details[open] .faq-icon {
          transform: rotate(180deg);
        }
        .faq-details[open] {
          border-color: rgba(245,166,35,0.2) !important;
          background: #111118 !important;
        }
        .faq-details[open] summary {
          color: #F5A623 !important;
        }
      `}</style>
    </div>
  );
}
