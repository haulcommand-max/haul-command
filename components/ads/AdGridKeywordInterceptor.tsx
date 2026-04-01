'use client';

import React, { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   AdGrid Keyword Interceptor — Sponsored Search Result Hijack
   CLAUDE_UI_HANDOFF_TASKS.md §1: Competitor Intercept
   Places a gold-bordered sponsored profile above organic results
   ═══════════════════════════════════════════════════════════════════ */

interface SponsoredListing {
  id: string;
  company_name: string;
  tagline: string;
  rating: number;
  reviews: number;
  verified: boolean;
  avatar_url?: string;
  cta_url: string;
  badge?: string;
  states: string[];
  bid_amount?: number;
}

interface AdGridKeywordInterceptorProps {
  query: string;
  sponsored: SponsoredListing | null;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

export function AdGridKeywordInterceptor({
  query,
  sponsored,
  onImpression,
  onClick,
}: AdGridKeywordInterceptorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sponsored) {
      const t = setTimeout(() => setVisible(true), 100);
      onImpression?.(sponsored.id);
      return () => clearTimeout(t);
    }
  }, [sponsored]);

  if (!sponsored) return null;

  return (
    <div className={`agki-card ${visible ? 'agki-card--visible' : ''}`}>
      {/* Glow ring */}
      <div className="agki-glow" />

      {/* Sponsored badge */}
      <div className="agki-badge-row">
        <span className="agki-sponsored">⚡ Sponsored</span>
        {sponsored.badge && <span className="agki-premium">{sponsored.badge}</span>}
      </div>

      {/* Content */}
      <div className="agki-body" onClick={() => onClick?.(sponsored.id)}>
        <div className="agki-avatar">
          {sponsored.avatar_url ? (
            <img src={sponsored.avatar_url} alt="" />
          ) : (
            <span className="agki-avatar__fallback">{sponsored.company_name[0]}</span>
          )}
          {sponsored.verified && <span className="agki-verified">✓</span>}
        </div>

        <div className="agki-info">
          <h4 className="agki-name">{sponsored.company_name}</h4>
          <p className="agki-tagline">{sponsored.tagline}</p>
          <div className="agki-meta">
            <span className="agki-stars">
              {'★'.repeat(Math.round(sponsored.rating))}
              {'☆'.repeat(5 - Math.round(sponsored.rating))}
              <span className="agki-rating">{sponsored.rating.toFixed(1)}</span>
              <span className="agki-reviews">({sponsored.reviews})</span>
            </span>
            <span className="agki-states">{sponsored.states.slice(0, 3).join(', ')}</span>
          </div>
        </div>

        <button className="agki-cta" onClick={(e) => { e.stopPropagation(); onClick?.(sponsored.id); }}>
          View Profile
        </button>
      </div>

      {/* Search context */}
      <div className="agki-context">
        Results for &ldquo;<strong>{query}</strong>&rdquo;
      </div>

      <style jsx>{`
        .agki-card {
          position: relative;
          background: linear-gradient(135deg, #0D1018 0%, #111520 100%);
          border: 2px solid rgba(198,146,58,0.4);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          opacity: 0;
          transform: translateY(-8px);
          transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
          overflow: hidden;
        }
        .agki-card--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .agki-glow {
          position: absolute;
          inset: -1px;
          border-radius: 16px;
          background: conic-gradient(
            from 0deg,
            rgba(198,146,58,0.3),
            rgba(198,146,58,0.05),
            rgba(198,146,58,0.3),
            rgba(198,146,58,0.05),
            rgba(198,146,58,0.3)
          );
          z-index: -1;
          animation: agki-rotate 4s linear infinite;
          filter: blur(1px);
        }
        @keyframes agki-rotate {
          to { transform: rotate(360deg); }
        }
        .agki-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .agki-sponsored {
          font-size: 10px;
          font-weight: 700;
          color: #C6923A;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          background: rgba(198,146,58,0.10);
          border-radius: 6px;
          border: 1px solid rgba(198,146,58,0.2);
        }
        .agki-premium {
          font-size: 10px;
          font-weight: 600;
          color: #22C55E;
          padding: 3px 8px;
          background: rgba(34,197,94,0.08);
          border-radius: 6px;
          border: 1px solid rgba(34,197,94,0.15);
        }
        .agki-body {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          cursor: pointer;
        }
        .agki-avatar {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(198,146,58,0.1);
          border: 2px solid rgba(198,146,58,0.3);
        }
        .agki-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .agki-avatar__fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: #C6923A;
        }
        .agki-verified {
          position: absolute;
          bottom: -3px;
          right: -3px;
          width: 18px;
          height: 18px;
          background: #22C55E;
          border-radius: 50%;
          font-size: 10px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          border: 2px solid #0D1018;
        }
        .agki-info {
          flex: 1;
          min-width: 0;
        }
        .agki-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #F0F0F0;
        }
        .agki-tagline {
          margin: 2px 0 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .agki-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }
        .agki-stars { color: #C6923A; }
        .agki-rating { color: #F0F0F0; margin-left: 4px; font-weight: 600; }
        .agki-reviews { color: #666; }
        .agki-states { color: #555; font-size: 11px; }
        .agki-cta {
          flex-shrink: 0;
          padding: 8px 16px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border: none;
          border-radius: 10px;
          color: #000;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .agki-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(198,146,58,0.35);
        }
        .agki-context {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 11px;
          color: #555;
        }
        .agki-context strong { color: #888; }
      `}</style>
    </div>
  );
}
