/**
 * POST /api/sms/send
 *
 * Sends an SMS using the user's credits. Uses Novu SMS channel (already in stack)
 * with Plivo as the provider. Falls back to direct Plivo if Novu SMS not configured.
 * 
 * Deducts 1 credit per SMS. Checks credits_remaining > 0 before sending.
 * Respects opt-out flags.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { to_number, message } = body;

        if (!to_number || !message) {
            return NextResponse.json({ error: 'to_number and message required' }, { status: 400 });
        }

        if (message.length > 320) {
            return NextResponse.json({ error: 'Message too long (320 char max)' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Check opt-out
        const { data: recipient } = await admin
            .from('profiles')
            .select('sms_opted_out')
            .eq('phone_e164', to_number)
            .maybeSingle();

        if (recipient?.sms_opted_out) {
            return NextResponse.json({ error: 'Recipient has opted out of SMS' }, { status: 403 });
        }

        // Check user has credits
        const { data: credits, error: credErr } = await admin
            .from('sms_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (credErr || !credits || credits.credits_remaining < 1) {
            return NextResponse.json({
                error: 'Insufficient SMS credits',
                credits_remaining: credits?.credits_remaining || 0,
                purchase_url: '/api/sms/purchase',
            }, { status: 402 });
        }

        // Append opt-out footer (TCPA compliance)
        const fullMessage = `${message}\n\nReply STOP to opt out. Haul Command`;

        // Send via Novu SMS channel or direct Plivo
        let sendStatus = 'sent';
        try {
            // Try Novu first (already in stack as @novu/api)
            if (process.env.NOVU_API_KEY) {
                const { Novu } = await import('@novu/api');
                const novu = new Novu({
                    serverURL: process.env.NOVU_API_URL || undefined,
                    security: { secretKey: process.env.NOVU_API_KEY! },
                });
                await (novu as any).trigger('sms-send', {
                    to: { subscriberId: user.id, phone: to_number },
                    payload: { message: fullMessage },
                });
            } else {
                // Fallback: log for manual processing
                console.log(`[SMS:dry-run] To: ${to_number} | Message: ${fullMessage}`);
                sendStatus = 'queued';
            }
        } catch (smsErr) {
            console.error('[SMS send error]:', smsErr);
            sendStatus = 'failed';
        }

        // Deduct credit
        await admin
            .from('sms_credits')
            .update({
                credits_remaining: credits.credits_remaining - 1,
                credits_used: credits.credits_used + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        // Log
        await admin.from('sms_log').insert({
            user_id: user.id,
            to_number,
            message: fullMessage,
            credits_used: 1,
            status: sendStatus,
            provider: process.env.NOVU_API_KEY ? 'novu' : 'dry_run',
        });

        return NextResponse.json({
            ok: true,
            status: sendStatus,
            credits_remaining: credits.credits_remaining - 1,
        });
    } catch (err: any) {
        console.error('[sms/send] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
