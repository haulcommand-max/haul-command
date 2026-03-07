export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/claims/initiate
 * Body: { surface_id: string, verification_route?: string }
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

        const body = await req.json();
        const { surface_id, verification_route } = body;

        if (!surface_id) return NextResponse.json({ success: false, error: 'surface_id required' }, { status: 400 });

        // 1. Get surface
        const { data: surface, error: surfErr } = await supabase
            .from('surfaces')
            .select('*')
            .eq('id', surface_id)
            .single();

        if (surfErr || !surface) {
            return NextResponse.json({ success: false, error: 'Surface not found' }, { status: 404 });
        }

        if (!['unclaimed', 'claimable'].includes(surface.claim_status)) {
            return NextResponse.json({ success: false, error: `Surface is ${surface.claim_status}` }, { status: 400 });
        }

        // 2. Anti-fraud: velocity check
        const dayAgo = new Date(Date.now() - 86400000).toISOString();
        const { count: recentClaims } = await supabase
            .from('claims')
            .select('id', { count: 'exact', head: true })
            .eq('claimant_user_id', user.id)
            .gte('created_at', dayAgo);

        if ((recentClaims ?? 0) >= 5) {
            return NextResponse.json({ success: false, error: 'Too many claim attempts. Please try again tomorrow.' }, { status: 429 });
        }

        // 3. Select route
        const availableRoutes = surface.claim_methods_available ?? [];
        const route = verification_route && availableRoutes.includes(verification_route)
            ? verification_route
            : availableRoutes[0] ?? 'manual';

        // 4. Generate token/OTP
        const isOtp = route === 'email_otp' || route === 'sms_otp';
        const token = isOtp
            ? String(Math.floor(100000 + Math.random() * 900000))
            : require('crypto').randomBytes(32).toString('hex');

        const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');
        const ttlMs = route === 'sms_otp' ? 10 * 60000 : route === 'email_otp' ? 20 * 60000 : 48 * 3600000;

        // 5. Create claim
        const { data: claim, error: createErr } = await supabase
            .from('claims')
            .insert({
                surface_id,
                claimant_user_id: user.id,
                country_code: surface.country_code ?? 'US',
                status: isOtp ? 'otp_sent' : route === 'document' || route === 'manual' ? 'review' : 'initiated',
                verification_route: route,
                verification_token: hashedToken,
                verification_token_expires: new Date(Date.now() + ttlMs).toISOString(),
            })
            .select()
            .single();

        if (createErr) {
            return NextResponse.json({ success: false, error: createErr.message }, { status: 500 });
        }

        // 6. Update surface
        await supabase.from('surfaces').update({
            claim_status: 'pending_verification',
            updated_at: new Date().toISOString(),
        }).eq('id', surface_id);

        // 7. Audit
        await supabase.from('claim_audit_log').insert({
            surface_id,
            claim_id: claim.id,
            actor: 'user',
            action: 'claim_initiated',
            payload: { route, user_id: user.id },
        });

        // 8. Build next_step message
        let next_step = '';
        const maskEmail = (e: string) => e ? `${e[0]}***@${e.split('@')[1]}` : '***';
        const maskPhone = (p: string) => p ? `***-***-${p.slice(-4)}` : '***';

        switch (route) {
            case 'email_otp':
                next_step = `OTP sent to ${maskEmail(surface.email)}. Enter it to verify.`;
                // TODO: Send actual email
                break;
            case 'sms_otp':
                next_step = `OTP sent to ${maskPhone(surface.phone)}. Enter it to verify.`;
                // TODO: Send actual SMS
                break;
            case 'dns':
                next_step = `Add TXT record: haulcommand-verify=${token}`;
                break;
            case 'website_token':
                next_step = `Add <meta name="haulcommand-verify" content="${token}"> or /.well-known/claim-token.txt`;
                break;
            case 'document':
                next_step = 'Upload a business document to verify ownership.';
                break;
            default:
                next_step = 'Your claim has been submitted for manual review.';
        }

        return NextResponse.json({
            success: true,
            claim_id: claim.id,
            status: claim.status,
            verification_route: route,
            next_step,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
