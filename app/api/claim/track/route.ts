import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/claim/track
 * Lightweight claim conversion event tracker.
 * Called server-side or client-side when a claim CTA is clicked.
 * Feeds the hc_claim_events table for funnel reporting.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            event_type = 'claim_cta_clicked',
            surface,
            entity_id,
            entity_slug,
            entity_type,
            country_code,
            admin1_code,
            page_url,
            session_id,
        } = body;

        // Basic validation
        if (!surface || !event_type) {
            return NextResponse.json({ error: 'surface and event_type required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get referrer from headers
        const referrer = req.headers.get('referer') || null;

        // Hash IP for privacy
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const ip_hash = Buffer.from(ip).toString('base64').slice(0, 16);

        const { error } = await supabase.from('hc_claim_events').insert({
            event_type,
            surface,
            entity_id: entity_id || null,
            entity_slug: entity_slug || null,
            entity_type: entity_type || null,
            country_code: country_code || null,
            admin1_code: admin1_code || null,
            page_url: page_url || null,
            referrer,
            session_id: session_id || null,
            ip_hash,
        });

        if (error) {
            console.error('[claim/track] insert error:', error.message);
            return NextResponse.json({ error: 'tracking failed' }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, {
            headers: { 'Cache-Control': 'no-store' }
        });
    } catch (e: any) {
        console.error('[claim/track] error:', e.message);
        return NextResponse.json({ ok: true }); // Never fail on tracking errors
    }
}
