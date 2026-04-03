'use client';

/**
 * CaptureProvider — Client-side context for the Capture Router
 * 
 * Tracks visitor identity signals (time on page, scroll depth, pageviews,
 * interactions) and provides them to CaptureOverlay for decision-making.
 * 
 * Wraps the app layout so every page can participate in the capture system.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { TriggerSignals } from '@/lib/capture/capture-router';
import type { VisitorIdentity, VisitorRole, PageContext, AlertCategory, CommunityConfirmation } from '@/lib/capture/identity-ladder';

// ── Context Shape ──
interface CaptureContextValue {
    signals: TriggerSignals;
    identity: VisitorIdentity;
    pageContext: PageContext;
    setPageContext: (ctx: Partial<PageContext>) => void;
    recordInteraction: (type: 'search' | 'filter' | 'click' | 'tool') => void;
    dismissed: boolean;
    dismiss: (key: string, cooldownMinutes: number) => void;
    isDismissed: (key: string) => boolean;
}

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function useCaptureContext() {
    const ctx = useContext(CaptureContext);
    if (!ctx) throw new Error('useCaptureContext must be used within CaptureProvider');
    return ctx;
}

// ── Default Identity (anonymous) ──
function defaultIdentity(): VisitorIdentity {
    return {
        rung: 'anonymous',
        sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'ssr',
        userId: null,
        email: null,
        inferredRole: 'unknown' as VisitorRole,
        roleConfidence: 0,
        facebookGroupConfirmed: 'unknown' as CommunityConfirmation,
        communityJoinedAt: null,
        alertCategories: [] as AlertCategory[],
        pushEnabled: false,
        savedStates: [],
        savedCorridors: [],
        savedOperators: [],
        savedSearches: [],
        followedRegulations: [],
        pageviewCount: 1,
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

function defaultPageContext(): PageContext {
    return {
        pageType: 'homepage',
        slug: '/',
    };
}

// ── localStorage helpers ──
function getStored<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function setStored(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Provider ──
export function CaptureProvider({ children }: { children: ReactNode }) {
    const [signals, setSignals] = useState<TriggerSignals>({
        timeOnPageSeconds: 0,
        sessionPageviews: getStored('hc_session_pv', 0) + 1,
        scrollDepthPct: 0,
        hasClickedResult: false,
        hasUsedSearch: false,
        hasUsedFilter: false,
        hasUsedTool: false,
        isMobile: false,
        isReturnVisitor: getStored('hc_return', false),
        referrerType: 'direct',
    });

    const [identity, setIdentity] = useState<VisitorIdentity>(() => {
        const stored = getStored<Partial<VisitorIdentity>>('hc_identity', {});
        return { ...defaultIdentity(), ...stored };
    });

    const [pageContext, setPageContextState] = useState<PageContext>(defaultPageContext());
    const [dismissed, setDismissed] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Track time on page
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSignals(prev => ({ ...prev, timeOnPageSeconds: prev.timeOnPageSeconds + 1 }));
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Track scroll depth
    useEffect(() => {
        const handleScroll = () => {
            const pct = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            setSignals(prev => ({ ...prev, scrollDepthPct: Math.max(prev.scrollDepthPct, pct) }));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Detect mobile + referrer + return visitor
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const referrer = document.referrer;
        let referrerType: TriggerSignals['referrerType'] = 'direct';
        if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) referrerType = 'organic';
        else if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('linkedin')) referrerType = 'social';
        else if (referrer && !referrer.includes(window.location.hostname)) referrerType = 'referral';

        setSignals(prev => ({ ...prev, isMobile, referrerType }));
        setStored('hc_return', true);
        setStored('hc_session_pv', signals.sessionPageviews);
    }, []);

    const setPageContext = useCallback((partial: Partial<PageContext>) => {
        setPageContextState(prev => ({ ...prev, ...partial }));
    }, []);

    const recordInteraction = useCallback((type: 'search' | 'filter' | 'click' | 'tool') => {
        setSignals(prev => ({
            ...prev,
            hasUsedSearch: prev.hasUsedSearch || type === 'search',
            hasUsedFilter: prev.hasUsedFilter || type === 'filter',
            hasClickedResult: prev.hasClickedResult || type === 'click',
            hasUsedTool: prev.hasUsedTool || type === 'tool',
        }));
    }, []);

    const dismiss = useCallback((key: string, cooldownMinutes: number) => {
        const until = Date.now() + cooldownMinutes * 60 * 1000;
        setStored(key, until);
        setDismissed(true);
    }, []);

    const isDismissed = useCallback((key: string): boolean => {
        const until = getStored<number>(key, 0);
        return until > Date.now();
    }, []);

    // Persist identity changes
    useEffect(() => {
        setStored('hc_identity', identity);
    }, [identity]);

    return (
        <CaptureContext.Provider value={{
            signals, identity, pageContext, setPageContext,
            recordInteraction, dismissed, dismiss, isDismissed,
        }}>
            {children}
        </CaptureContext.Provider>
    );
}
