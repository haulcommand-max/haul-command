export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';


function code6() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Rate limit: 10 claim attempts per minute per IP
const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:claim',
    })
    : null;

export async function POST(req: Request) {
    // ── Rate Limiting ──
    if (ratelimit) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success, remaining } = await ratelimit.limit(ip);
        if (!success) {
            return NextResponse.json(
                { error: 'Too many claim attempts. Please wait a moment.' },
                { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
            );
        }
    }

    const body = await req.json();
    const { profileId, phone, email, method } = body as {
        profileId: string;
        phone?: string;
        email?: string;
        method: "sms" | "email";
    };

    if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });
    if (method === "sms" && !phone) return NextResponse.json({ error: "phone required for SMS" }, { status: 400 });
    if (method === "email" && !email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const verification_code = code6();
    const code_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from("claim_requests")
        .insert({
            profile_id: profileId,
            phone: phone ?? null,
            email: email ?? null,
            verification_method: method,
            verification_code,
            code_expires_at,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Send verification code via Resend (email method) ──
    let emailSent = false;
    if (method === "email" && email && process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'dispatch@haulcommand.com',
                to: email,
                subject: `Your HAUL COMMAND verification code: ${verification_code}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #030712; color: #F9FAFB;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="font-size: 20px; font-weight: 800; color: #F59E0B; margin: 0; letter-spacing: 0.1em;">HAUL COMMAND</h1>
                        </div>
                        <h2 style="font-size: 18px; font-weight: 700; color: #F9FAFB; margin: 0 0 12px; text-align: center;">Claim Your Listing</h2>
                        <p style="font-size: 14px; color: #9CA3AF; text-align: center; margin: 0 0 24px;">
                            Use the code below to verify your identity and claim ownership of your listing on HAUL COMMAND.
                        </p>
                        <div style="background: rgba(245,158,11,0.1); border: 2px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.3em; color: #F59E0B;">${verification_code}</span>
                        </div>
                        <p style="font-size: 12px; color: #6B7280; text-align: center; margin: 0 0 16px;">
                            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;" />
                        <p style="font-size: 11px; color: #4B5563; text-align: center; margin: 0;">
                            HAUL COMMAND — The World's Heavy Haul Directory<br/>
                            <a href="https://haulcommand.com" style="color: #F59E0B; text-decoration: none;">haulcommand.com</a>
                        </p>
                    </div>
                `,
            });
            emailSent = true;
        } catch (emailErr) {
            console.error('[CLAIM] Failed to send verification email:', emailErr);
            // Don't fail the claim start — code is in DB, operator can retry
        }
    }

    // ── Track claim_started event (PostHog server-side) ──
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                    distinct_id: email || phone || profileId,
                    event: 'claim_started',
                    properties: {
                        profile_id: profileId,
                        method,
                        email_sent: emailSent,
                    },
                }),
            });
        } catch { /* analytics should never block claim */ }
    }

    // Dev echo for testing without Resend key
    const devEcho = process.env.NODE_ENV !== "production" && !emailSent
        ? { dev_code: verification_code }
        : {};

    console.log(`[CLAIM] Profile ${profileId} claim started via ${method}. Email sent: ${emailSent}`);

    return NextResponse.json({ claimRequestId: data.id, emailSent, ...devEcho });
}
