// app/api/v1/admin/system/route.ts
// GET — system health check across all integrations
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAllFlags } from '@/lib/feature-flags';
import { healthCheck as traccarHealth } from '@/lib/telematics/traccar';
import { healthCheck as telnyxHealth } from '@/lib/comms/telnyx';

export const runtime = 'nodejs';

export async function GET() {
    const flags = getAllFlags();
    const start = Date.now();

    // Run health checks in parallel
    const [traccar, telnyx] = await Promise.allSettled([
        traccarHealth(),
        telnyxHealth(),
    ]);

    // Check Supabase
    let supabaseOk = false;
    try {
        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}/rest/v1/?limit=0`,
            { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' } }
        );
        supabaseOk = res.ok;
    } catch {
        supabaseOk = false;
    }

    // Check Stripe
    let stripeOk = false;
    try {
        const stripe = await import('@/lib/stripe/client');
        if ((stripe as any).stripe) stripeOk = true;
    } catch {
        stripeOk = !!process.env.STRIPE_SECRET_KEY;
    }

    const integrations = {
        supabase: { status: supabaseOk ? 'healthy' : 'unreachable', required: true },
        stripe: { status: stripeOk ? 'configured' : 'missing_key', required: true },
        firebase: { status: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'configured' : 'missing_key', required: true },
        traccar: { status: traccar.status === 'fulfilled' && traccar.value ? 'healthy' : 'offline', required: false },
        telnyx: { status: telnyx.status === 'fulfilled' && telnyx.value ? 'healthy' : 'offline', required: false },
        typesense: { status: !!process.env.TYPESENSE_API_KEY ? 'configured' : 'missing_key', required: false },
        posthog: { status: !!process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'configured' : 'missing_key', required: false },
        langfuse: { status: !!process.env.LANGFUSE_SECRET_KEY ? 'configured' : 'missing_key', required: false },
        trigger_dev: { status: !!process.env.TRIGGER_API_KEY ? 'configured' : 'missing_key', required: false },
        here_maps: { status: !!process.env.HERE_API_KEY ? 'configured' : 'missing_key', required: false },
        vapi: { status: !!process.env.VAPI_PRIVATE_API_KEY ? 'configured' : 'missing_key', required: false },
        sentry: { status: !!process.env.SENTRY_DSN ? 'configured' : 'missing_key', required: false },
    };

    const enabledCount = Object.values(flags).filter(f => f.enabled).length;
    const totalCount = Object.keys(flags).length;

    return NextResponse.json({
        status: supabaseOk && stripeOk ? 'operational' : 'degraded',
        uptime_check_ms: Date.now() - start,
        integrations,
        flags: {
            enabled: enabledCount,
            total: totalCount,
            pct: Math.round((enabledCount / totalCount) * 100),
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
}
