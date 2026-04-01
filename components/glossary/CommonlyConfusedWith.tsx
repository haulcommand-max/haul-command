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
      <div style={{
        background: '#121214',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(251,146,60,0.12)',
            border: '1px solid rgba(251,146,60,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Commonly Confused With
            </h3>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              margin: '2px 0 0',
            }}>
              Know the difference — these terms are often mixed up with <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{currentTerm}</strong>
            </p>
          </div>
        </div>

        {/* Confused terms list */}
        <div style={{ padding: '8px 0' }}>
          {hasRealData ? (
            confusedTerms.map((ct, i) => (
              <Link
                key={ct.slug}
                href={`/glossary/${ct.slug}`}
                aria-label={`Learn about ${ct.term}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 24px',
                  textDecoration: 'none',
                  borderBottom: i < confusedTerms.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {/* VS badge */}
                <div style={{
                  flexShrink: 0,
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: '#EF4444',
                  letterSpacing: '0.05em',
                  marginTop: 2,
                }}>
                  VS
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {ct.term}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderBottom: i < Math.min(relatedSlugs.length, 3) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#FB923C', flexShrink: 0, opacity: 0.6,
                }} />
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'capitalize',
                }}>
                  {slug.replace(/-/g, ' ')}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
