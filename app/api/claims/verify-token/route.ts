export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/claims/verify-token
 * Body: { claim_id: string }
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

        const { claim_id } = await req.json();
        if (!claim_id) return NextResponse.json({ success: false, error: 'claim_id required' }, { status: 400 });

        const { data: claim } = await supabase
            .from('claims')
            .select('*')
            .eq('id', claim_id)
            .eq('claimant_user_id', user.id)
            .single();

        if (!claim) return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });

        // Queue for review (in production, would check DNS/website)
        await supabase.from('claims').update({ status: 'review', updated_at: new Date().toISOString() }).eq('id', claim_id);

        await supabase.from('claim_audit_log').insert({
            surface_id: claim.surface_id, claim_id,
            actor: 'system', action: 'token_verification_queued',
            payload: { route: claim.verification_route },
        });

        return NextResponse.json({
            success: true, claim_id, status: 'review',
            next_step: 'Token verification queued. We\'ll check within 24 hours.',
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
