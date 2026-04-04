import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════
// POST /api/identity/claim — Operator profile claim funnel
//
// SECURITY FIX: Replaced fake length > 5 OTP check with real
// Supabase email OTP verification via verifyOtp().
//
// Flow:
//   1. Client triggers supabase.auth.signInWithOtp({ email })
//   2. User receives email with 6-digit OTP
//   3. Client posts { operatorId, claimMethod:'email', token, email }
//   4. This route calls supabase.auth.verifyOtp() to validate the token
//   5. On success: upgrades hc_global_operators.claim_status = 'verified'
//                  links hc_global_operators.user_id = authenticated user
//   6. Returns redirect URL to operator dashboard
//
// Additional protection:
//   - Rate limit: 5 attempts per email per hour (via hc_claim_attempts)
//   - Only unclaimed/pending operators can be claimed
//   - Claim token is single-use (Supabase OTP is invalidated after verify)
// ═══════════════════════════════════════════════════════════════
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { operatorId, claimMethod, verificationToken, phoneOrEmail } = await req.json();

    if (!operatorId || !claimMethod || !verificationToken || !phoneOrEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: operatorId, claimMethod, verificationToken, phoneOrEmail.' },
        { status: 400 }
      );
    }

    // ── Validate claimMethod ──
    if (!['email', 'sms'].includes(claimMethod)) {
      return NextResponse.json({ error: 'Invalid claimMethod. Use "email" or "sms".' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // ── Rate limit: check recent claim attempts ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: attemptCount } = await sb
      .from('hc_claim_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('contact', phoneOrEmail.toLowerCase())
      .gte('attempted_at', oneHourAgo);

    if ((attemptCount ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Too many claim attempts. Please wait 1 hour before trying again.' },
        { status: 429 }
      );
    }

    // ── Log this attempt ──
    await sb.from('hc_claim_attempts').insert({
      operator_id: operatorId,
      contact: phoneOrEmail.toLowerCase(),
      claim_method: claimMethod,
      attempted_at: new Date().toISOString(),
    }).throwOnError();

    // ── Verify OTP via Supabase Auth ──
    // Both email and phone OTP verification use the same verifyOtp API.
    // Email OTP: type = 'email'
    // SMS OTP: type = 'sms'
    const verifyPayload = claimMethod === 'email'
      ? { type: 'email' as const, email: phoneOrEmail, token: verificationToken }
      : { type: 'sms' as const, phone: phoneOrEmail, token: verificationToken };

    // Use an ephemeral client (not admin) so Supabase runs normal OTP validation
    const authClient = await createClient();
    const { data: otpData, error: otpError } = await authClient.auth.verifyOtp(verifyPayload);

    if (otpError || !otpData?.user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Request a new one.' },
        { status: 401 }
      );
    }

    const verifiedUserId = otpData.user.id;

    // ── Check operator exists and is claimable ──
    const { data: operator, error: opError } = await sb
      .from('hc_global_operators')
      .select('id, claim_status, user_id, business_name')
      .eq('id', operatorId)
      .single();

    if (opError || !operator) {
      return NextResponse.json({ error: 'Operator profile not found.' }, { status: 404 });
    }

    if (operator.claim_status === 'verified' && operator.user_id !== verifiedUserId) {
      return NextResponse.json(
        { error: 'This profile has already been claimed by another user.' },
        { status: 409 }
      );
    }

    // ── Upgrade operator claim status and link user_id ──
    const { error: updateError } = await sb
      .from('hc_global_operators')
      .update({
        claim_status: 'verified',
        user_id: verifiedUserId,
        primary_trust_source: claimMethod === 'sms' ? 'Supabase SMS OTP' : 'Supabase Email OTP',
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', operatorId);

    if (updateError) throw updateError;

    // ── Mark claim attempts as resolved ──
    await sb
      .from('hc_claim_attempts')
      .update({ resolved: true })
      .eq('operator_id', operatorId)
      .eq('contact', phoneOrEmail.toLowerCase());

    return NextResponse.json({
      success: true,
      message: `Profile "${operator.business_name}" claimed successfully. Welcome to the Haul Command network.`,
      redirectUrl: `/dashboard/operator`,
    });

  } catch (error: any) {
    console.error('[CLAIM_API_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
