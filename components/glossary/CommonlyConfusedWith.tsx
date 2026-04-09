/**
 * CommonlyConfusedWith — SEO + authority section for glossary term pages.
 *
 * P1: Shows terms commonly confused with the current term, with clear
 * differentiators. Drives internal linking and keeps users on-site.
 *
 * Data comes from `commonly_confused` jsonb column on glossary_public,
 * or generates comparison from related_slugs as fallback.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface ConfusedTerm {
  slug: string;
  term: string;
  difference: string;
}

interface CommonlyConfusedWithProps {
  /** Current term name */
  currentTerm: string;
  /** Array of commonly confused terms with differentiators */
  confusedTerms: ConfusedTerm[];
  /** Fallback: related slugs to show if no confusion data exists */
  relatedSlugs?: string[];
  className?: string;
}

export default function CommonlyConfusedWith({
  currentTerm,
  confusedTerms,
  relatedSlugs = [],
  className = '',
}: CommonlyConfusedWithProps) {
  // If no confused terms and no related slugs, don't render
  if (confusedTerms.length === 0 && relatedSlugs.length === 0) return null;

  const hasRealData = confusedTerms.length > 0;

  return (
    <section className={`commonly-confused ${className}`}>
      <div className="bg-[#101012] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Commonly Confused With
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Know the difference — these terms are often mixed up with <strong className="text-gray-200">{currentTerm}</strong>
            </p>
          </div>
        </div>

        {/* Confused terms list */}
        <div className="py-2">
          {hasRealData ? (
            confusedTerms.map((ct, i) => (
              <Link
                key={ct.slug}
                href={`/glossary/${ct.slug}`}
                aria-label={`Learn about ${ct.term}`}
                className={`flex items-start gap-4 p-5 hover:bg-white/5 transition-colors group ${
                  i < confusedTerms.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                {/* VS badge */}
                <div className="shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-black text-red-500 tracking-widest mt-1 group-hover:bg-red-500/20 transition-colors">
                  VS
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white mb-2 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                    {ct.term}
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed m-0">
                    {ct.difference}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            // Fallback: show related terms as potential confusion points
            relatedSlugs.slice(0, 3).map((slug, i) => (
              <Link
                key={slug}
                href={`/glossary/${slug}`}
                aria-label={`Learn about ${slug.replace(/-/g, ' ')}`}
                className={`flex items-center gap-3 py-3 px-6 hover:bg-white/5 transition-colors group ${
                  i < Math.min(relatedSlugs.length, 3) - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60 shrink-0 group-hover:scale-150 transition-transform" />
                <span className="text-sm font-semibold text-gray-300 capitalize group-hover:text-white transition-colors">
                  {slug.replace(/-/g, ' ')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-white transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
