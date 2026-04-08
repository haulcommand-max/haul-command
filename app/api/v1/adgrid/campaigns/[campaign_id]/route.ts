import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET  /v1/adgrid/campaigns/{campaign_id} — Get campaign detail
// POST /v1/adgrid/campaigns/{campaign_id}/recommendations — Get AI recs
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { campaign_id: string } },
) {
    try {
        const db = supabase();

        const { data, error } = await db
            .from('adg_campaigns')
            .select('*')
            .eq('id', params.campaign_id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        return NextResponse.json({
            campaign_id: data.id,
            campaign_name: data.campaign_name,
            status: data.status,
            budget_minor_units: data.budget_minor_units,
            spent_minor_units: data.spent_minor_units,
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
            ctr: data.ctr,
            target_countries: data.target_countries,
            starts_at: data.starts_at,
            ends_at: data.ends_at,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
