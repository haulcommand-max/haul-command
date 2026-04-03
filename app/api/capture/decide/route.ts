/**
 * POST /api/capture/decide
 *
 * Server-side capture decision endpoint for SSR pages.
 * Called by server components that need to pre-render a capture offer
 * without waiting for client-side JavaScript.
 *
 * Body: { identity, pageContext, signals }
 * Returns: { offer: CaptureOffer | null }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    shouldTrigger,
    decideCaptureOffer,
    type TriggerSignals,
    type CaptureOffer,
} from '@/lib/capture/capture-router';
import type { VisitorIdentity, PageContext } from '@/lib/capture/identity-ladder';

// Default signals for SSR (no behavioral data yet)
const SSR_DEFAULT_SIGNALS: TriggerSignals = {
    timeOnPageSeconds: 0,
    sessionPageviews: 1,
    scrollDepthPct: 0,
    hasClickedResult: false,
    hasUsedSearch: false,
    hasUsedFilter: false,
    hasUsedTool: false,
    isMobile: false,
    isReturnVisitor: false,
    referrerType: 'direct',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const identity: VisitorIdentity = body.identity;
        const pageContext: PageContext = body.pageContext;
        const signals: TriggerSignals = body.signals || SSR_DEFAULT_SIGNALS;

        if (!pageContext?.pageType) {
            return NextResponse.json({ offer: null });
        }

        // For SSR, we skip shouldTrigger() behavioral check
        // and just decide the best offer for this page + identity combo
        const offer = decideCaptureOffer(identity, pageContext, signals);

        if (!offer || offer.type === 'none') {
            return NextResponse.json({ offer: null });
        }

        return NextResponse.json({ offer });
    } catch (err) {
        console.error('Capture decide error:', err);
        return NextResponse.json({ offer: null });
    }
}
