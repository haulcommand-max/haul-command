// app/api/intelligence/funnel/route.ts
//
// POST: Record a claim funnel event
// GET:  Retrieve funnel conversion analytics

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    recordFunnelEvent,
    getFunnelConversionRates,
    detectRole,
    type EntryPoint,
    type FunnelStep,
} from '@/lib/intelligence/claim-funnel-router';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── POST: Record funnel event ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            session_id,
            user_id,
            entry_point,
            referral_code,
            funnel_step,
            landing_url,
            utm_source,
            utm_medium,
            utm_campaign,
            country_code,
            device_type,
            context_text,  // Optional: for role detection
            metadata,
        } = body;

        if (!entry_point || !funnel_step) {
            return NextResponse.json({
                error: 'entry_point and funnel_step required',
            }, { status: 400 });
        }

        // Auto-detect role if context provided
        let detected_role;
        let role_confidence;
        if (context_text) {
            const detection = detectRole(context_text, landing_url);
            detected_role = detection.role;
            role_confidence = detection.confidence;
        }

        const result = await recordFunnelEvent({
            session_id,
            user_id,
            entry_point: entry_point as EntryPoint,
            referral_code,
            funnel_step: funnel_step as FunnelStep,
            landing_url,
            utm_source,
            utm_medium,
            utm_campaign,
            country_code,
            device_type,
            detected_role,
            role_confidence,
            metadata,
        });

        return NextResponse.json(result);

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

// ── GET: Funnel conversion analytics ──────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const entryPoint = url.searchParams.get('entry_point') as EntryPoint | undefined;
        const dateFrom = url.searchParams.get('from') || undefined;
        const dateTo = url.searchParams.get('to') || undefined;

        const rates = await getFunnelConversionRates(
            entryPoint || undefined,
            dateFrom,
            dateTo,
        );

        return NextResponse.json(rates);

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
