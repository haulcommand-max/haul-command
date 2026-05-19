/**
 * POST /api/referral/track
 *
 * Called when a new operator signs up via a referral link.
 * Increments the referral code uses_count and creates a pending reward.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ref_code } = body;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!ref_code) {
            return NextResponse.json({ error: 'ref_code required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Look up the referral code
        const { data: refCode, error: codeErr } = await admin
            .from('referral_codes')
            .select('*')
            .eq('code', ref_code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (codeErr || !refCode) {
            return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 404 });
        }

        // Don't allow self-referral
        if (refCode.operator_id === user.id) {
            return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
        }

        // Check if this user was already referred
        const { data: existingReward } = await admin
            .from('referral_rewards')
            .select('id')
            .eq('referred_id', user.id)
            .maybeSingle();

        if (existingReward) {
            return NextResponse.json({
                ok: true,
                message: 'This user was already referred.',
                already_tracked: true,
            });
        }

        // Create pending reward
        const { error: rewardErr } = await admin
            .from('referral_rewards')
            .insert({
                referrer_id: refCode.operator_id,
                referred_id: user.id,
                referral_code_id: refCode.id,
                status: 'pending',
                reward_amount_usd: 25.00,
            });

        if (rewardErr) throw rewardErr;

        // Increment uses count
        await admin
            .from('referral_codes')
            .update({ uses_count: refCode.uses_count + 1 })
            .eq('id', refCode.id);

        return NextResponse.json({
            ok: true,
            referrer_id: refCode.operator_id,
            reward_status: 'pending',
            message: 'Referral tracked. Reward becomes active when referred user upgrades to paid.',
        });
    } catch (err: any) {
        console.error('[referral/track] Error:', err);
        return NextResponse.json({ error: 'Referral tracking failed' }, { status: 500 });
    }
}
