import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/adgrid/campaigns — Create campaign
// GET  /v1/adgrid/campaigns/{campaign_id} — Get campaign
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const {
            advertiser_entity_id, campaign_name, campaign_type,
            objective_type, budget_minor_units, currency_code,
            target_countries, target_regions, target_corridors,
            starts_at, ends_at,
        } = body;

        if (!advertiser_entity_id || !campaign_name) {
            return NextResponse.json(
                { error: 'advertiser_entity_id and campaign_name required' },
                { status: 400 },
            );
        }

        const { data, error } = await db
            .from('adg_campaigns')
            .insert({
                advertiser_entity_id,
                campaign_name,
                campaign_type: campaign_type || 'standard',
                objective_type: objective_type || 'visibility',
                budget_minor_units: budget_minor_units || 0,
                currency_code: currency_code || 'USD',
                target_countries: target_countries || [],
                target_regions: target_regions || [],
                target_corridors: target_corridors || [],
                starts_at: starts_at || null,
                ends_at: ends_at || null,
                status: 'draft',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({
            campaign_id: data.id,
            status: 'draft',
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
