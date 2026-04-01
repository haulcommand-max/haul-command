'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, Bell, Bookmark, Radio, Users, Zap, ChevronRight, X,
  MapPin, Search, TrendingUp, Award,
} from 'lucide-react';
import { track } from '@/lib/telemetry';
import type { CaptureOffer, OfferType, TriggerSignals, PageContext, VisitorIdentity } from '@/lib/capture';
import { decideCaptureOffer, shouldTrigger, isDismissed, markDismissed } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// CAPTURE SLIDE-IN — Contextual capture router UI
//
// NOT a popup. A slide-in / bottom-sheet that shows the
// best next step based on identity state + page context.
//
// Design: Glassmorphism dark card with amber accent.
// Animations: slide-up from bottom, 300ms ease-out.
// ══════════════════════════════════════════════════════════════

interface CaptureSlideInProps {
  identity: VisitorIdentity;
  pageContext: PageContext;
}

const ICON_MAP: Record<OfferType, React.ReactNode> = {
  claim_profile: <Shield className="w-5 h-5" />,
  verify_profile: <Award className="w-5 h-5" />,
  set_availability: <Radio className="w-5 h-5" />,
  set_coverage: <MapPin className="w-5 h-5" />,
  subscribe_alerts: <Bell className="w-5 h-5" />,
  save_search: <Search className="w-5 h-5" />,
  save_corridor: <Bookmark className="w-5 h-5" />,
  save_state: <Bookmark className="w-5 h-5" />,
  follow_regulation: <Bell className="w-5 h-5" />,
  save_operator: <Bookmark className="w-5 h-5" />,
  get_urgent_dispatch: <Zap className="w-5 h-5" />,
  upgrade_premium: <TrendingUp className="w-5 h-5" />,
  join_community: <Users className="w-5 h-5" />,
  two_path_chooser: <Zap className="w-5 h-5" />,
  none: null,
};

export default function CaptureSlideIn({ identity, pageContext }: CaptureSlideInProps) {
  const [offer, setOffer] = useState<CaptureOffer | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissedState] = useState(false);
  const signalsRef = useRef<TriggerSignals>({
    timeOnPageSeconds: 0,
    sessionPageviews: identity.pageviewCount,
    scrollDepthPct: 0,
    hasClickedResult: false,
    hasUsedSearch: false,
    hasUsedFilter: false,
    hasUsedTool: false,
    isMobile: false,
    isReturnVisitor: identity.pageviewCount > 1,
    referrerType: 'unknown',
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggered = useRef(false);

  // Detect mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      signalsRef.current.isMobile = window.innerWidth < 768;
    }
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        signalsRef.current.scrollDepthPct = Math.round((scrollTop / docHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for interaction events
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-directory-result]')) {
        signalsRef.current.hasClickedResult = true;
      }
      if (target.closest('[data-search-input]')) {
        signalsRef.current.hasUsedSearch = true;
      }
      if (target.closest('[data-filter-control]')) {
        signalsRef.current.hasUsedFilter = true;
      }
      if (target.closest('[data-tool-interact]')) {
        signalsRef.current.hasUsedTool = true;
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Timer: check trigger conditions every 5s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      signalsRef.current.timeOnPageSeconds += 5;

      if (hasTriggered.current) return;

      if (shouldTrigger(signalsRef.current, pageContext)) {
        const decided = decideCaptureOffer(identity, pageContext, signalsRef.current);

        if (decided && !isDismissed(decided.dismissKey, decided.cooldownMinutes)) {
          setOffer(decided);
          setVisible(true);
          hasTriggered.current = true;

          track('capture_offer_shown' as any, {
            entity_type: 'capture',
            entity_id: decided.type,
            metadata: {
              page_type: pageContext.pageType,
              identity_rung: identity.rung,
              offer_type: decided.type,
              variant: decided.variant,
            },
          });
        }
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [identity, pageContext]);

  const handleDismiss = useCallback(() => {
    if (offer) {
      markDismissed(offer.dismissKey);
      track('capture_offer_dismissed' as any, {
        entity_type: 'capture',
        entity_id: offer.type,
        metadata: { page_type: pageContext.pageType },
      });
    }
    setDismissedState(true);
    setTimeout(() => setVisible(false), 300);
  }, [offer, pageContext]);

  const handleCtaClick = useCallback(() => {
    if (offer) {
      track('capture_offer_clicked' as any, {
        entity_type: 'capture',
        entity_id: offer.type,
        metadata: {
          page_type: pageContext.pageType,
          cta_type: 'primary',
          offer_type: offer.type,
        },
      });
    }
  }, [offer, pageContext]);

  const handleSecondaryClick = useCallback(() => {
    if (offer) {
      track('capture_offer_clicked' as any, {
        entity_type: 'capture',
        entity_id: offer.type,
        metadata: {
          page_type: pageContext.pageType,
          cta_type: 'secondary',
          offer_type: offer.type,
        },
      });
    }
  }, [offer, pageContext]);

  if (!offer || !visible || dismissed) return null;

  const isExternal = offer.ctaUrl.startsWith('http');
  const isSecondaryExternal = offer.secondaryCta?.url.startsWith('http');

  // ── Bottom Sheet variant (mobile-first) ──
  if (offer.variant === 'bottom_sheet') {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-label="Contextual suggestion"
      >
        <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-5 space-y-4">
            {/* Icon + Content */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                {ICON_MAP[offer.type] || <span className="text-lg">{offer.icon}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white leading-tight">
                  {offer.headline}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5 leading-snug">
                  {offer.subtext}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              {isExternal ? (
                <a
                  href={offer.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCtaClick}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 group"
                >
                  {offer.ctaLabel}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <Link
                  href={offer.ctaUrl}
                  onClick={handleCtaClick}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 group"
                  aria-label={offer.ctaLabel}
                >
                  {offer.ctaLabel}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {offer.secondaryCta && (
                isSecondaryExternal ? (
                  <a
                    href={offer.secondaryCta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSecondaryClick}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition-all border border-white/10"
                  >
                    {offer.secondaryCta.label}
                  </a>
                ) : (
                  <Link
                    href={offer.secondaryCta.url}
                    onClick={handleSecondaryClick}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition-all border border-white/10"
                    aria-label={offer.secondaryCta.label}
                  >
                    {offer.secondaryCta.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Slide-In variant (desktop sidebar) ──
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-right duration-300"
      role="dialog"
      aria-label="Contextual suggestion"
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 space-y-3.5">
          {/* Icon + Content */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {ICON_MAP[offer.type] || <span className="text-base">{offer.icon}</span>}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-sm font-bold text-white leading-tight">
                {offer.headline}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {offer.subtext}
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-2">
            {isExternal ? (
              <a
                href={offer.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 group"
              >
                {offer.ctaLabel}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <Link
                href={offer.ctaUrl}
                onClick={handleCtaClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 group"
                aria-label={offer.ctaLabel}
              >
                {offer.ctaLabel}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {offer.secondaryCta && (
              isSecondaryExternal ? (
                <a
                  href={offer.secondaryCta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSecondaryClick}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-all border border-white/10"
                >
                  {offer.secondaryCta.label}
                </a>
              ) : (
                <Link
                  href={offer.secondaryCta.url}
                  onClick={handleSecondaryClick}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-all border border-white/10"
                  aria-label={offer.secondaryCta.label}
                >
                  {offer.secondaryCta.label}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
