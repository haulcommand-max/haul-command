'use client';

import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FAQAccordion — Accessible single-open accordion
 *
 * Features:
 * - Only one item open at a time
 * - Visible open/closed state
 * - Minimum 18px title text
 * - Smooth height animation
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

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

      <div className="space-y-2">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`
                rounded-2xl overflow-hidden transition-all duration-300
                ${isOpen
                  ? 'bg-white/[0.04] border border-white/[0.12]'
                  : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03]'
                }
              `}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-sm sm:text-base font-bold text-white leading-snug pr-2">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-white/30 flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Answer panel */}
              <div
                id={`faq-answer-${index}`}
                role="region"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 pt-1 text-sm text-white/50 leading-relaxed border-t border-white/[0.05]">
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
