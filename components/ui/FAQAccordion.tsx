'use client';

import React, { ReactNode } from 'react';

/**
 * FAQAccordion — Converted to statically visible FAQ list for maximum SEO
 *
 * Features:
 * - All answers perpetually visible, eliminating mobile rendering penalties
 * - Internal link support in answers
 * - FAQPage schema generation
 */

interface FAQItem {
  question: string;
  answer: string | ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
  /** Optional heading above the accordion */
  heading?: string;
  /** Generate FAQPage JSON-LD schema */
  generateSchema?: boolean;
  className?: string;
}

export function FAQAccordion({
  items,
  heading,
  generateSchema = false,
  className = '',
}: FAQAccordionProps) {
  return (
    <div className={className}>
      {heading && (
        <h2 className="text-xl sm:text-2xl font-black text-white mb-5 tracking-tight">
          {heading}
        </h2>
      )}

      {/* Schema markup */}
      {generateSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: items.map(item => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: typeof item.answer === 'string' ? item.answer : '',
                },
              })),
            }),
          }}
        />
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          return (
            <div
              key={index}
              className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.12]"
            >
              <div
                className="w-full flex items-center justify-between gap-4 px-5 pt-4 text-left"
              >
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug w-full">
                  {item.question}
                </h3>
              </div>

              {/* Answer panel (Always fully expanded for SEO crawlability) */}
              <div
                id={`faq-answer-${index}`}
                role="region"
                className="overflow-visible"
              >
                <div className="px-5 pb-5 pt-2 text-sm text-white/70 leading-relaxed border-t border-white/[0.05] mt-3">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
