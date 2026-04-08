/**
 * components/seo/QuickAnswerBlock.tsx
 * Machine-readable "Quick Answer" block for AI search visibility.
 *
 * Renders:
 *  - Visible summary block for users
 *  - schema.org DefinedTerm or speakable JSON-LD
 *  - Answer Engine / LLM optimized structured text
 *
 * Usage:
 *   <QuickAnswerBlock
 *     question="What is a pilot car?"
 *     answer="A pilot car, also called an escort vehicle, leads or follows an oversize load..."
 *     source="Haul Command Glossary"
 *     confidence="verified_current"
 *     lastUpdated="2026-04"
 *     nextStep={{ label: 'Find pilot cars near you', href: '/directory' }}
 *   />
 */

import Link from 'next/link';

type ConfidenceState =
  | 'verified_current'
  | 'verified_but_review_due'
  | 'partially_verified'
  | 'seeded_needs_review'
  | 'historical_reference_only';

const CONFIDENCE_LABELS: Record<ConfidenceState, { label: string; color: string }> = {
  verified_current: { label: 'Verified', color: 'text-green-400' },
  verified_but_review_due: { label: 'Verified · Review Due', color: 'text-amber-400' },
  partially_verified: { label: 'Partially Verified', color: 'text-amber-400' },
  seeded_needs_review: { label: 'Draft · Needs Review', color: 'text-gray-400' },
  historical_reference_only: { label: 'Historical Reference', color: 'text-gray-500' },
};

interface NextStep {
  label: string;
  href: string;
}

interface QuickAnswerProps {
  question: string;
  answer: string;
  /** Optional short answer (1–2 sentences) for AI snippet extraction */
  shortAnswer?: string;
  source?: string;
  confidence?: ConfidenceState;
  lastUpdated?: string;
  nextStep?: NextStep;
  /** For glossary DefinedTerm schema */
  termKey?: string;
  /** Additional FAQs to include in JSON-LD */
  relatedFaqs?: { question: string; answer: string }[];
  className?: string;
}

export default function QuickAnswerBlock({
  question,
  answer,
  shortAnswer,
  source,
  confidence = 'seeded_needs_review',
  lastUpdated,
  nextStep,
  termKey,
  relatedFaqs,
  className,
}: QuickAnswerProps) {
  const confidenceInfo = CONFIDENCE_LABELS[confidence];

  // Build JSON-LD (speakable + FAQ)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: shortAnswer ?? answer,
        },
      },
      ...(relatedFaqs ?? []).map(({ question: q, answer: a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    ],
  };

  // DefinedTerm for glossary pages
  const definedTermJsonLd = termKey
    ? {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: question,
        description: shortAnswer ?? answer,
        url: `https://haulcommand.com/glossary/${termKey}`,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: 'Haul Command Heavy Haul Glossary',
          url: 'https://haulcommand.com/glossary',
        },
      }
    : null;

  return (
    <>
      {/* Structured data injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {definedTermJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
        />
      )}

      {/* Visual quick answer block */}
      <div
        className={`rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 ${className ?? ''}`}
        data-qa-block="true"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        {/* Header strip */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest">
            Quick Answer
          </span>
          {confidence && (
            <span className={`text-xs ${confidenceInfo.color} ml-auto`}>
              {confidenceInfo.label}
            </span>
          )}
        </div>

        {/* Question */}
        <p
          className="text-sm font-semibold text-white mb-2"
          itemProp="mainEntity"
          itemScope
          itemType="https://schema.org/Question"
        >
          <span itemProp="name">{question}</span>
        </p>

        {/* Answer */}
        <div
          itemProp="acceptedAnswer"
          itemScope
          itemType="https://schema.org/Answer"
        >
          {shortAnswer && (
            <p className="text-base text-white font-medium mb-1" itemProp="text">
              {shortAnswer}
            </p>
          )}
          <p className="text-sm text-gray-300 leading-relaxed">
            {answer}
          </p>
        </div>

        {/* Meta: source + freshness */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          {source && <span>Source: {source}</span>}
          {lastUpdated && <span>Updated: {lastUpdated}</span>}
        </div>

        {/* Next step CTA */}
        {nextStep && (
          <div className="mt-4 pt-3 border-t border-amber-500/10">
            <Link
              href={nextStep.href}
              className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              {nextStep.label}
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
