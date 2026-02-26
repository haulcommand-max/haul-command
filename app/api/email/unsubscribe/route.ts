export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/email/unsubscribe?token=xxx&email=xxx
 * 
 * CAN-SPAM compliant one-click unsubscribe.
 * Updates email_preferences.newsletter_opt_in = false
 * Adds to email_suppression with reason 'user_unsubscribe'
 */

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const email = url.searchParams.get('email');

        if (!email) {
            return new Response(renderPage('Missing email parameter', false), {
                status: 400,
                headers: { 'Content-Type': 'text/html' },
            });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Add to suppression list
        await supabase.from('email_suppression').upsert({
            email: normalizedEmail,
            reason: 'user_unsubscribe',
        });

        // 2. Find user by email and update preferences
        const { data: users } = await supabase.auth.admin.listUsers();
        const matchedUser = users?.users?.find(
            u => u.email?.toLowerCase() === normalizedEmail
        );

        if (matchedUser) {
            await supabase
                .from('email_preferences')
                .upsert({
                    user_id: matchedUser.id,
                    newsletter_opt_in: false,
                    product_updates: false,
                    viewed_you: false,
                    claim_reminders: false,
                    leaderboard_alerts: false,
                    corridor_risk_pulse: false,
                    updated_at: new Date().toISOString(),
                });
        }

        // 3. Log the unsubscribe event
        await supabase.from('email_events').insert({
            user_id: matchedUser?.id || null,
            email: normalizedEmail,
            event_type: 'unsubscribed',
            meta: { source: 'one_click_link' },
        });

        return new Response(renderPage('You have been unsubscribed', true), {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (err: any) {
        console.error('[unsubscribe] Error:', err);
        return new Response(renderPage('Something went wrong. Please try again.', false), {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
        });
    }
}

function renderPage(message: string, success: boolean): string {
    const icon = success ? '✅' : '⚠️';
    const sub = success
        ? "You won't receive any more emails from us. If this was a mistake, log in and update your notification settings."
        : "Please contact support@haulcommand.com if the issue persists.";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribe — Haul Command</title>
<style>
    body { margin:0; padding:0; background:#0a0b07; font-family:'Helvetica Neue',Arial,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#111210; border:1px solid #1a1c14; border-radius:12px; padding:48px; max-width:480px; text-align:center; }
    .icon { font-size:48px; margin-bottom:16px; }
    h1 { color:#fff; font-size:22px; margin:0 0 12px; }
    p { color:#9ca3af; font-size:14px; line-height:1.6; margin:0; }
    a { color:#C6923A; text-decoration:none; }
</style>
</head>
<body>
    <div class="card">
        <div class="icon">${icon}</div>
        <h1>${message}</h1>
        <p>${sub}</p>
        <p style="margin-top:24px;"><a href="/">← Back to Haul Command</a></p>
    </div>
</body>
</html>`;
}
