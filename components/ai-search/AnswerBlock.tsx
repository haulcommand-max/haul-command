'use client';
// components/ai-search/AnswerBlock.tsx
// Citation-ready answer blocks for AI search engines + snippets.
// Rule: every high-value page gets one. Crawlable HTML, not JS-only.
// Serves: ai_search_answer_os, search_intent_capture, seo_loop

"use client";

import React from "react";

export type ConfidenceLevel = "verified_current" | "verified_but_review_due" | "partially_verified" | "seeded_needs_human_review" | "historical_reference_only";

interface AnswerBlockProps {
  /** The question this block answers */
  question: string;
  /** Concise direct answer (1-3 sentences, citation-ready) */
  answer: string;
  /** Expandable depth content */
  details?: string;
  /** Source attribution */
  source?: string;
  sourceUrl?: string;
  /** Freshness */
  lastVerified?: string;
  confidence?: ConfidenceLevel;
  /** Entity context */
  entityType?: "regulation" | "definition" | "rate" | "corridor" | "tool" | "market" | "role";
  country?: string;
  region?: string;
  /** Next action */
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
}

const CONFIDENCE_BADGES: Record<ConfidenceLevel, { label: string; color: string }> = {
  verified_current: { label: "Verified Current", color: "#10b981" },
  verified_but_review_due: { label: "Review Scheduled", color: "#f59e0b" },
  partially_verified: { label: "Partially Verified", color: "#f59e0b" },
  seeded_needs_human_review: { label: "Pending Review", color: "#ef4444" },
  historical_reference_only: { label: "Historical Reference", color: "#6b7280" },
};

export function AnswerBlock({
  question, answer, details, source, sourceUrl,
  lastVerified, confidence = "verified_current",
  entityType, country, region,
  ctaLabel, ctaUrl, secondaryCtaLabel, secondaryCtaUrl,
}: AnswerBlockProps) {
  const [expanded, setExpanded] = React.useState(false);
  const badge = CONFIDENCE_BADGES[confidence];

  return (
    <section
      className="hc-answer-block"
      itemScope
      itemType="https://schema.org/Question"
      data-entity-type={entityType}
      data-country={country}
      data-region={region}
      data-confidence={confidence}
    >
      <h3 itemProp="name" className="hc-answer-question">{question}</h3>

      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
        <p itemProp="text" className="hc-answer-text">{answer}</p>
      </div>

      {/* Freshness + Confidence */}
      <div className="hc-answer-meta">
        {lastVerified && (
          <span className="hc-answer-freshness">
            Last verified: <time dateTime={lastVerified}>{new Date(lastVerified).toLocaleDateString()}</time>
          </span>
        )}
        <span className="hc-answer-confidence" style={{ color: badge.color }}>
          {badge.label}
        </span>
        {source && (
          <span className="hc-answer-source">
            Source: {sourceUrl
              ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{source}</a>
              : source
            }
          </span>
        )}
      </div>

      {/* Expandable depth */}
      {details && (
        <div className="hc-answer-details">
          <button
            onClick={() => setExpanded(!expanded)}
            className="hc-answer-expand-btn"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Learn more"}
          </button>
          {expanded && <div className="hc-answer-depth">{details}</div>}
        </div>
      )}

      {/* Next Action — no dead ends */}
      {ctaLabel && ctaUrl && (
        <div className="hc-answer-actions">
          <a href={ctaUrl} className="hc-answer-cta-primary">{ctaLabel}</a>
          {secondaryCtaLabel && secondaryCtaUrl && (
            <a href={secondaryCtaUrl} className="hc-answer-cta-secondary">{secondaryCtaLabel}</a>
          )}
        </div>
      )}
    </section>
  );
}

/** Server-rendered answer block for pure SSR / crawlability */
export function StaticAnswerBlock({
  question, answer, source, sourceUrl, lastVerified,
  confidence = "verified_current", ctaLabel, ctaUrl,
}: Omit<AnswerBlockProps, "details">) {
  const badge = CONFIDENCE_BADGES[confidence];
  return (
    <section className="hc-answer-block" itemScope itemType="https://schema.org/Question">
      <h3 itemProp="name">{question}</h3>
      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
        <p itemProp="text">{answer}</p>
      </div>
      <div className="hc-answer-meta">
        {lastVerified && <span>Last verified: {new Date(lastVerified).toLocaleDateString()}</span>}
        <span style={{ color: badge.color }}>{badge.label}</span>
        {source && sourceUrl && <a href={sourceUrl} rel="noopener noreferrer">{source}</a>}
      </div>
      {ctaLabel && ctaUrl && (
        <div className="hc-answer-actions">
          <a href={ctaUrl} className="hc-answer-cta-primary">{ctaLabel}</a>
        </div>
      )}
    </section>
  );
}
