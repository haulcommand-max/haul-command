// app/api/intelligence/authority/route.ts
//
// POST: Run authority engine jobs (weekly pulse, response badges, scarcity alerts)
// GET:  Retrieve market pulses and scarcity alerts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    runAuthorityEngineJobs,
    generateWeeklyPulse,
    computeResponseBadges,
    detectScarcityAlerts,
} from '@/lib/intelligence/authority-engine';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── POST: Trigger authority engine jobs ────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        // Auth: Require CRON_SECRET
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
        }
        const authHeader = req.headers.get('authorization') || '';
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { job } = body;  // 'all' | 'pulse' | 'badges' | 'scarcity'

        let result;

        switch (job) {
            case 'pulse':
                result = await generateWeeklyPulse();
                break;
            case 'badges':
                result = await computeResponseBadges();
                break;
            case 'scarcity':
                result = await detectScarcityAlerts();
                break;
            case 'all':
            default:
                result = await runAuthorityEngineJobs();
                break;
        }

        return NextResponse.json({ job: job || 'all', result });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

// ── GET: Retrieve authority data ──────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type') || 'pulse';  // pulse | scarcity | badges
        const region = url.searchParams.get('region');
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);

        if (type === 'pulse') {
            let query = supabase
                .from('authority_market_pulses')
                .select('*')
                .eq('published', true)
                .order('pulse_week', { ascending: false })
                .limit(limit);

            if (region) query = query.eq('region_code', region);

            const { data, error } = await query;
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            return NextResponse.json({ pulses: data || [] });
        }

        if (type === 'scarcity') {
            let query = supabase
                .from('scarcity_alerts')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (region) query = query.eq('region_code', region);

            const { data, error } = await query;
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            return NextResponse.json({ alerts: data || [] });
        }

        if (type === 'badges') {
            let query = supabase
                .from('response_speed_badges')
                .select('*')
                .neq('badge_tier', 'none')
                .order('avg_response_sec', { ascending: true })
                .limit(limit);

            const { data, error } = await query;
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });

            return NextResponse.json({ badges: data || [] });
        }

        return NextResponse.json({ error: 'invalid type: use pulse, scarcity, or badges' }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
