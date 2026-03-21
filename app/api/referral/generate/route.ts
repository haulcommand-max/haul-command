/**
 * POST /api/referral/generate
 * Generates a unique 6-char referral code for the authenticated operator.
 *
 * GET /api/referral/generate
 * Returns the operator's existing referral code + stats.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // Get existing code
        const { data: existing } = await admin
            .from('referral_codes')
            .select('*')
            .eq('operator_id', user.id)
            .eq('is_active', true)
            .single();

        if (!existing) {
            return NextResponse.json({
                ok: true,
                has_code: false,
                message: 'No referral code yet. POST to generate one.',
            });
        }

        // Get rewards stats
        const { data: rewards } = await admin
            .from('referral_rewards')
            .select('status, reward_amount_usd')
            .eq('referrer_id', user.id);

        const stats = {
            total_referrals: existing.uses_count,
            pending_rewards: (rewards || []).filter(r => r.status === 'pending').length,
            qualified_rewards: (rewards || []).filter(r => r.status === 'qualified').length,
            paid_rewards: (rewards || []).filter(r => r.status === 'paid').length,
            total_earned_usd: (rewards || [])
                .filter(r => r.status === 'paid')
                .reduce((sum, r) => sum + Number(r.reward_amount_usd), 0),
            pending_amount_usd: (rewards || [])
                .filter(r => r.status === 'pending' || r.status === 'qualified')
                .reduce((sum, r) => sum + Number(r.reward_amount_usd), 0),
        };

        return NextResponse.json({
            ok: true,
            has_code: true,
            code: existing.code,
            referral_link: `https://haulcommand.com/claim?ref=${existing.code}`,
            stats,
        });
    } catch (err: any) {
        console.error('[referral/generate GET] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // Check if they already have an active code
        const { data: existing } = await admin
            .from('referral_codes')
            .select('code')
            .eq('operator_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                ok: true,
                code: existing.code,
                referral_link: `https://haulcommand.com/claim?ref=${existing.code}`,
                message: 'You already have an active referral code.',
            });
        }

        // Generate unique code (retry on collision)
        let code = '';
        let attempts = 0;
        while (attempts < 5) {
            code = generateCode();
            const { data: collision } = await admin
                .from('referral_codes')
                .select('id')
                .eq('code', code)
                .maybeSingle();
            if (!collision) break;
            attempts++;
        }

        if (!code) {
            return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
        }

        const { data, error } = await admin
            .from('referral_codes')
            .insert({
                operator_id: user.id,
                code,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            ok: true,
            code: data.code,
            referral_link: `https://haulcommand.com/claim?ref=${data.code}`,
            message: 'Share this link with other operators. You earn $25 for every paid conversion.',
        });
    } catch (err: any) {
        console.error('[referral/generate POST] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
