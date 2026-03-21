/**
 * GET /api/sms/balance
 * Returns current SMS credit balance for the authenticated user.
 *
 * POST /api/sms/optout
 * Handles STOP/HELP/UNSUBSCRIBE keywords from inbound webhook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        const { data: credits } = await admin
            .from('sms_credits')
            .select('credits_remaining, credits_used')
            .eq('user_id', user.id)
            .maybeSingle();

        return NextResponse.json({
            ok: true,
            credits_remaining: credits?.credits_remaining || 0,
            credits_used: credits?.credits_used || 0,
        });
    } catch (err: any) {
        console.error('[sms/balance] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
