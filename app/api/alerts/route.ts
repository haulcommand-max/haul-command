import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Outcome Alerts API — Band D Rank 6
 * 
 * GET: Retrieve pending alerts for a user
 * POST: Create a new outcome-driven alert
 * 
 * Alert types: load_filled, match_found, rescue_worked,
 * profile_claim_advanced, market_density_improved, corridor_spike,
 * new_verified_operator, new_support_location, supply_gap
 */

export const dynamic = 'force-dynamic';

const ALERT_TEMPLATES: Record<string, { title: string; icon: string; priority: 'high' | 'medium' | 'low' }> = {
    load_filled: { title: 'Load Filled', icon: '✓', priority: 'high' },
    match_found: { title: 'Match Found', icon: '🤝', priority: 'high' },
    rescue_worked: { title: 'Rescue Successful', icon: '🚨', priority: 'high' },
    profile_claim_advanced: { title: 'Claim Progress', icon: '🛡', priority: 'medium' },
    market_density_improved: { title: 'Market Growing', icon: '📡', priority: 'low' },
    corridor_activity_spike: { title: 'Corridor Activity', icon: '📈', priority: 'medium' },
    new_verified_operator: { title: 'New Verified Operator', icon: '✓', priority: 'low' },
    new_support_location: { title: 'Support Added', icon: '🏗', priority: 'low' },
    supply_gap_alert: { title: 'Supply Gap', icon: '⚠️', priority: 'medium' },
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const state = searchParams.get('state');

    try {
        const supabase = getSupabaseAdmin();

        // Pull from behavioral_events as alert source
        let query = supabase
            .from('behavioral_events')
            .select('id, event_type, created_at, metadata, entity_type, entity_id')
            .in('event_type', Object.keys(ALERT_TEMPLATES))
            .order('created_at', { ascending: false })
            .limit(limit);

        const { data: events, error } = await query;

        if (error) {
            // Table may not exist — return empty
            return NextResponse.json({ alerts: [], total: 0 });
        }

        const alerts = (events || []).map((ev: any) => {
            const template = ALERT_TEMPLATES[ev.event_type] || { title: ev.event_type, icon: '●', priority: 'low' as const };
            return {
                id: ev.id,
                type: ev.event_type,
                title: template.title,
                icon: template.icon,
                priority: template.priority,
                detail: ev.metadata?.detail || ev.metadata?.message || `${template.title} recorded`,
                market: ev.metadata?.state || ev.metadata?.market || null,
                corridor: ev.metadata?.corridor || null,
                timestamp: ev.created_at,
                next_action: ev.metadata?.next_action || null,
            };
        });

        return NextResponse.json({ alerts, total: alerts.length });
    } catch (error: any) {
        return NextResponse.json({ alerts: [], total: 0, error: error?.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = getSupabaseAdmin();

        const template = ALERT_TEMPLATES[body.type];
        if (!template) {
            return NextResponse.json({ error: 'Unknown alert type' }, { status: 400 });
        }

        await supabase.from('behavioral_events').insert({
            event_type: body.type,
            entity_type: body.entity_type || null,
            entity_id: body.entity_id || null,
            metadata: {
                detail: body.detail || template.title,
                state: body.state || null,
                market: body.market || null,
                corridor: body.corridor || null,
                next_action: body.next_action || null,
                ...body.metadata,
            },
        });

        return NextResponse.json({ created: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create alert', details: error?.message }, { status: 500 });
    }
}
