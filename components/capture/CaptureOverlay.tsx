'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  shouldTrigger,
  decideCaptureOffer,
  isDismissed,
  markDismissed,
  type CaptureOffer,
  type TriggerSignals,
} from '@/lib/capture/capture-router';
import type { VisitorIdentity, PageContext } from '@/lib/capture/identity-ladder';

// ═══════════════════════════════════════════════════════════════
// CAPTURE OVERLAY — Client-side renderer for capture-router.ts
//
// This component:
// 1. Collects real-time behavioral signals (time, scroll, clicks)
// 2. Feeds them to shouldTrigger() + decideCaptureOffer()
// 3. Renders the resulting CaptureOffer as a slide-in or bottom sheet
//
// Mounts in root layout. Fires ONCE per session slot.
// ═══════════════════════════════════════════════════════════════

function getStoredIdentity(): VisitorIdentity {
  if (typeof window === 'undefined') return defaultIdentity();
  try {
    const raw = localStorage.getItem('hc_visitor_identity');
    if (raw) return JSON.parse(raw) as VisitorIdentity;
  } catch {}
  return defaultIdentity();
}

function defaultIdentity(): VisitorIdentity {
  return {
    rung: 'anonymous',
    sessionId: '',
    userId: null,
    email: null,
    inferredRole: 'unknown',
    roleConfidence: 0,
    facebookGroupConfirmed: 'unknown',
    communityJoinedAt: null,
    alertCategories: [],
    pushEnabled: false,
    savedStates: [],
    savedCorridors: [],
    savedOperators: [],
    savedSearches: [],
    followedRegulations: [],
    pageviewCount: 0,
    firstVisitAt: new Date().toISOString(),
    lastVisitAt: new Date().toISOString(),
    totalSessionSeconds: 0,
    directoryPageviews: 0,
    toolUsageCount: 0,
    searchCount: 0,
    scrollDepthMax: 0,
    claimState: null,
    profileCompletionPct: 0,
    stripeCustomerId: null,
    subscriptionTier: 'none',
    sponsorActive: false,
  };
}

function inferPageContext(): PageContext {
  if (typeof window === 'undefined') return { pageType: 'homepage', slug: '' };
  const path = window.location.pathname;
  
  if (path.startsWith('/directory')) return { pageType: 'operator_directory', slug: path };
  if (path.startsWith('/regulations')) return { pageType: 'regulation', slug: path };
  if (path.startsWith('/glossary')) return { pageType: 'glossary', slug: path };
  if (path.startsWith('/blog')) return { pageType: 'blog', slug: path };
  if (path.startsWith('/tools')) return { pageType: 'tool', slug: path };
  if (path.startsWith('/corridor')) return { pageType: 'corridor', slug: path };
  if (path.startsWith('/certification')) return { pageType: 'certification', slug: path };
  if (path.startsWith('/near-me')) return { pageType: 'directory_search', slug: path };
  if (path.startsWith('/state')) return { pageType: 'state_page', slug: path };
  if (path === '/') return { pageType: 'homepage', slug: path };
  return { pageType: 'resource_hub', slug: path };
}

export default function CaptureOverlay() {
  const [offer, setOffer] = useState<CaptureOffer | null>(null);
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);
  const startRef = useRef(Date.now());
  const signalsRef = useRef<TriggerSignals>({
    timeOnPageSeconds: 0,
    sessionPageviews: 1,
    scrollDepthPct: 0,
    hasClickedResult: false,
    hasUsedSearch: false,
    hasUsedFilter: false,
    hasUsedTool: false,
    isMobile: false,
    isReturnVisitor: false,
    referrerType: 'unknown',
  });

  // Track session pageviews
  useEffect(() => {
    const count = parseInt(sessionStorage.getItem('hc_pv') || '0', 10) + 1;
    sessionStorage.setItem('hc_pv', count.toString());
    signalsRef.current.sessionPageviews = count;
    signalsRef.current.isMobile = window.innerWidth < 768;
    signalsRef.current.isReturnVisitor = !!localStorage.getItem('hc_visitor_identity');
    
    // Detect referrer
    const ref = document.referrer;
    if (!ref) signalsRef.current.referrerType = 'direct';
    else if (ref.includes('google') || ref.includes('bing') || ref.includes('duckduckgo')) signalsRef.current.referrerType = 'organic';
    else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('linkedin')) signalsRef.current.referrerType = 'social';
    else signalsRef.current.referrerType = 'referral';
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        signalsRef.current.scrollDepthPct = Math.round((window.scrollY / docHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track interactions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-search]')) signalsRef.current.hasUsedSearch = true;
      if (target.closest('[data-filter]')) signalsRef.current.hasUsedFilter = true;
      if (target.closest('[data-tool-interact]')) signalsRef.current.hasUsedTool = true;
      if (target.closest('[data-result]')) signalsRef.current.hasClickedResult = true;
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Polling loop — check every 5s if we should trigger
  const checkTrigger = useCallback(() => {
    if (firedRef.current) return;

    signalsRef.current.timeOnPageSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const pageContext = inferPageContext();
    
    if (!shouldTrigger(signalsRef.current, pageContext)) return;

    const identity = getStoredIdentity();
    const decision = decideCaptureOffer(identity, pageContext, signalsRef.current);
    
    if (!decision) return;
    if (isDismissed(decision.dismissKey, decision.cooldownMinutes)) return;

    firedRef.current = true;
    setOffer(decision);
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    const interval = setInterval(checkTrigger, 5000);
    return () => clearInterval(interval);
  }, [checkTrigger]);

  const handleDismiss = () => {
    if (offer) markDismissed(offer.dismissKey);
    setVisible(false);
    setTimeout(() => setOffer(null), 400);
  };

  if (!offer) return null;

  // ── Render ──
  const isBottomSheet = offer.variant === 'bottom_sheet';

  return (
    <>
      {/* Backdrop */}
      {isBottomSheet && visible && (
        <div
          onClick={handleDismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.3s',
            opacity: visible ? 1 : 0,
          }}
        />
      )}
      
      {/* Offer Card */}
      <div
        role="dialog"
        aria-label="Capture offer"
        style={{
          position: 'fixed',
          zIndex: 9999,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          ...(isBottomSheet
            ? {
                bottom: 0, left: 0, right: 0,
                transform: visible ? 'translateY(0)' : 'translateY(100%)',
              }
            : {
                bottom: '1.5rem',
                right: '1.5rem',
                maxWidth: '380px',
                width: '100%',
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
              }),
        }}
      >
        <div
          style={{
            background: '#111114',
            border: '1px solid rgba(212,168,67,0.15)',
            borderRadius: isBottomSheet ? '1.25rem 1.25rem 0 0' : '1.25rem',
            padding: '1.5rem 1.5rem 1.5rem',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Drag handle for bottom sheet */}
          {isBottomSheet && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'none', border: 'none',
              color: '#6B7280', fontSize: '1.25rem', cursor: 'pointer',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ✕
          </button>

          {/* Icon */}
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{offer.icon}</div>

          {/* Headline */}
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#F9FAFB',
            margin: '0 0 0.375rem',
            lineHeight: 1.3,
          }}>
            {offer.headline}
          </h3>

          {/* Subtext */}
          <p style={{
            fontSize: '0.875rem',
            color: '#9CA3AF',
            margin: '0 0 1.25rem',
            lineHeight: 1.55,
          }}>
            {offer.subtext}
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href={offer.ctaUrl}
              onClick={() => {
                handleDismiss();
                // Wire to Money OS intake pipeline
                fetch('/api/intake', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    channel: 'web_form',
                    payload: {
                      type: 'capture_cta_click',
                      offer_type: offer.type,
                      headline: offer.headline,
                      cta_url: offer.ctaUrl,
                      page: typeof window !== 'undefined' ? window.location.pathname : '',
                      trigger_signals: signalsRef.current,
                    },
                    priority: 'normal',
                    metadata: { source: 'capture_overlay', variant: offer.variant },
                  }),
                }).catch(() => {}); // Non-blocking, don't break UX
              }}
              style={{
                display: 'block',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #D4A843, #b8892c)',
                color: '#0B0B0C',
                fontWeight: 700,
                fontSize: '0.9375rem',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              {offer.ctaLabel}
            </Link>

            {offer.secondaryCta && (
              <Link
                href={offer.secondaryCta.url}
                onClick={handleDismiss}
                style={{
                  display: 'block',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#D1D5DB',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                {offer.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
