export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as crypto from 'crypto';

/**
 * POST /api/claims/verify-otp
 * Body: { claim_id: string, otp: string }
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

        const body = await req.json();
        const { claim_id, otp } = body;

        if (!claim_id || !otp) {
            return NextResponse.json({ success: false, error: 'claim_id and otp required' }, { status: 400 });
        }

        // 1. Get claim
        const { data: claim, error: claimErr } = await supabase
            .from('claims')
            .select('*')
            .eq('id', claim_id)
            .eq('claimant_user_id', user.id)
            .single();

        if (claimErr || !claim) {
            return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
        }

        // 2. Check status
        if (!['otp_sent', 'initiated'].includes(claim.status)) {
            return NextResponse.json({ success: false, error: `Claim is ${claim.status}` }, { status: 400 });
        }

        // 3. Check expiry
        if (new Date(claim.verification_token_expires) < new Date()) {
            return NextResponse.json({ success: false, error: 'OTP expired. Please request a new one.' }, { status: 400 });
        }

        // 4. Check attempts
        if ((claim.verification_attempts ?? 0) >= 5) {
            await supabase.from('claims').update({
                status: 'rejected', rejected_reason: 'too_many_attempts',
            }).eq('id', claim_id);
            return NextResponse.json({ success: false, error: 'Too many failed attempts.' }, { status: 400 });
        }

        // 5. Verify OTP
        const hashed = crypto.createHash('sha256').update(otp).digest('hex');
        if (hashed !== claim.verification_token) {
            await supabase.from('claims').update({
                verification_attempts: (claim.verification_attempts ?? 0) + 1,
            }).eq('id', claim_id);
            return NextResponse.json({ success: false, error: 'Invalid code. Please try again.' });
        }

        // 6. OTP valid → approve
        const now = new Date().toISOString();

        await supabase.from('claims').update({
            status: 'approved', approved_at: now, updated_at: now,
        }).eq('id', claim_id);

        await supabase.from('surfaces').update({
            claim_status: 'claimed', claim_owner_id: user.id, updated_at: now,
        }).eq('id', claim.surface_id);

        await supabase.from('claim_audit_log').insert({
            surface_id: claim.surface_id, claim_id: claim_id,
            actor: 'system', action: 'claim_approved',
            payload: { method: 'otp', user_id: user.id },
        });

        return NextResponse.json({
            success: true, claim_id, status: 'approved',
            next_step: 'Congratulations! Your listing is now claimed.',
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
