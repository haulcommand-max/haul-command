'use client';

import React from 'react';
import Link from 'next/link';

/**
 * DA 97 Accelerator Hack #3 — Database-Driven Smart AutoLinker
 *
 * UPGRADE from the existing hardcoded AutoLinker:
 * - Now accepts a dynamic term map loaded from the glossary database
 * - Supports unlimited terms (3,000+ and growing)
 * - Can be used across Load Board, Directory profiles, blog articles,
 *   regulations pages, tools pages, and training pages
 * - Every highlighted term creates a crawlable dofollow internal backlink
 *   to the glossary, compounding DA across the entire content graph
 *
 * Usage:
 * <SmartAutoLinker text={loadDescription} termMap={glossaryTermMap} />
 *
 * The termMap is fetched server-side and passed as a prop.
 * This keeps the component client-side for interactivity while
 * the data is server-rendered for SEO.
 */

export interface GlossaryTermMapEntry {
  slug: string;
  canonical_term: string;
}

interface SmartAutoLinkerProps {
  /** The raw text to scan for glossary terms */
  text: string;
  /** Map of lowercase term/alias → { slug, canonical_term } */
  termMap: Record<string, GlossaryTermMapEntry>;
  /** Optional CSS class */
  className?: string;
  /** Max number of terms to link per text block (prevents over-linking) */
  maxLinks?: number;
  /** Whether to show tooltip preview on hover */
  withTooltip?: boolean;
}

export default function SmartAutoLinker({
  text,
  termMap,
  className = '',
  maxLinks = 5,
}: SmartAutoLinkerProps) {
  if (!text || !termMap || Object.keys(termMap).length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort terms by length descending so "steerable schnabel" matches before "steerable"
  // Filter out terms shorter than 4 chars to prevent over-linking ("load", "job", etc.)
  const terms = Object.keys(termMap)
    .filter(t => t.length >= 4)
    .sort((a, b) => b.length - a.length);

  // Escape regex special chars
  const escaped = terms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

  const parts = text.split(pattern);
  let linkCount = 0;
  const linkedTerms = new Set<string>(); // Track first-occurrence-only per term

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const entry = termMap[lowerPart];

        // Only link if: (1) term exists, (2) under maxLinks, (3) first occurrence of this term
        if (entry && linkCount < maxLinks && !linkedTerms.has(lowerPart)) {
          linkCount++;
          linkedTerms.add(lowerPart);
          return (
            <Link
              key={`autolink-${i}`}
              href={`/glossary/${entry.slug}`}
              className="text-yellow-500 hover:text-yellow-400 font-medium underline decoration-yellow-500/30 transition-colors"
              title={entry.canonical_term}
            >
              {part}
            </Link>
          );
        }
        return <React.Fragment key={`text-${i}`}>{part}</React.Fragment>;
      })}
    </span>
  );
}
