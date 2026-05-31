export const dynamic = 'force-dynamic';

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    adgridUuidOrNull,
    buildAdgridClickInsert,
    buildAdgridEventInsert,
} from '@/lib/monetization/adgrid-serving';

function hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

/**
 * POST /api/ads/click
 * Compatibility click endpoint. Records into the canonical hc_adgrid_* tables.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            campaign_id,
            creative_id,
            placement_id,
            slot_id,
            session_id,
            country_code,
            state_code,
            role,
            variant,
        } = body as {
            campaign_id?: string;
            creative_id?: string;
            placement_id?: string;
            slot_id?: string;
            session_id?: string;
            country_code?: string;
            state_code?: string;
            role?: string;
            variant?: string;
        };

        if (!campaign_id) {
            return NextResponse.json({ recorded: false, reason: 'campaign_id_required' }, { status: 400 });
        }

        const validCampaignId = adgridUuidOrNull(campaign_id);
        if (!validCampaignId) {
            return NextResponse.json({ recorded: false, reason: 'invalid_campaign_id' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded.split(',')[0]?.trim() || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';
        const ipHash = hashValue(ip);
        const uaHash = hashValue(userAgent || 'unknown');

        if (!userAgent || userAgent.length < 10) {
            const event = buildAdgridEventInsert({
                eventType: 'click',
                campaignId: validCampaignId,
                slotId: slot_id ?? placement_id,
                surface: placement_id || 'ads_click',
                countryCode: country_code,
                sessionId: session_id ?? ipHash,
                userAgentSummary: `${uaHash}:bot_no_ua`,
            });
            await admin.from(event.table).insert(event.payload);
            return NextResponse.json({ recorded: false, reason: 'invalid_user_agent' });
        }

        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { count } = await admin
            .from('hc_adgrid_events')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', validCampaignId)
            .eq('session_id', session_id ?? ipHash)
            .in('event_type', ['click', 'sponsor_cta_click'])
            .gte('created_at', oneHourAgo);

        if ((count ?? 0) >= 5) {
            return NextResponse.json({ recorded: false, reason: 'rate_limited' }, { status: 429 });
        }

        const click = buildAdgridClickInsert(
            { campaign_id: validCampaignId, creative_id, ab_variant: variant },
            {
                placementKey: placement_id || slot_id || 'ads_click',
                country: country_code,
                state: state_code,
                role,
                slotId: slot_id ?? placement_id,
                referrer: req.headers.get('referer'),
            },
        );
        if (click) {
            const { error } = await admin.from(click.table).insert(click.payload);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const event = buildAdgridEventInsert({
            eventType: 'click',
            campaignId: validCampaignId,
            slotId: slot_id ?? placement_id,
            surface: placement_id || 'ads_click',
            countryCode: country_code,
            sessionId: session_id ?? ipHash,
            userAgentSummary: `${uaHash}:valid`,
        });
        const { error: eventError } = await admin.from(event.table).insert(event.payload);
        if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

        return NextResponse.json({ recorded: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal error';
        console.error('Ad click error:', message);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
