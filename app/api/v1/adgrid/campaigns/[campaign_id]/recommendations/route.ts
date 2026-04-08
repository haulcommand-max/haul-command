import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/adgrid/campaigns/{campaign_id}/recommendations — Get AI recs
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    _req: NextRequest,
    { params }: { params: { campaign_id: string } },
) {
    try {
        const db = supabase();

        // Get pending recommendations for this campaign
        const { data: recommendations, error } = await db
            .from('adg_recommendations')
            .select('id, recommendation_type, reason, severity, estimated_impact, status, created_at')
            .eq('campaign_id', params.campaign_id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({
            recommendations: recommendations || [],
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
