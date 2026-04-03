import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// POST /api/developers/sandbox-key
// Captures sandbox API key requests.
// Inserts into enterprise_api_keys table (or api_waitlist if table not in migration yet).
// Sends confirmation email (via Supabase Edge Function or Resend — fire and forget).

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, use_case, company } = body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Generate a sandbox key token (non-privileged, rate-limited server-side)
        const sandboxKey = `hc_sandbox_${generateToken(24)}`;

        // Try enterprise_api_keys table first (from existing schema)
        const { error: insertError } = await supabase
            .from('enterprise_api_keys')
            .upsert({
                email: email.toLowerCase().trim(),
                company_name: company || null,
                use_case: use_case || null,
                key_hash: sandboxKey,                  // store key (hash in production)
                tier: 'sandbox',
                rate_limit_day: 100,
                status: 'active',
                created_at: new Date().toISOString(),
            }, { onConflict: 'email' })
            .select()
            .single();

        // If enterprise_api_keys doesn't exist yet, fall back to hc_events
        if (insertError) {
            await supabase.from('hc_events').insert({
                event_type: 'sandbox_key_request',
                properties: {
                    email: email.toLowerCase().trim(),
                    company: company || null,
                    use_case: use_case || null,
                    sandbox_key: sandboxKey,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                },
            });
        }

        // Track intake event for lead scoring
        await supabase.from('intake_events').insert({
            surface_type: 'api_sandbox_request',
            contact_email: email.toLowerCase().trim(),
            intent_score: 65,      // Developers are high-intent
            metadata: { company, use_case, sandbox_key: sandboxKey },
        }).maybeSingle();

        // TODO: Trigger Supabase Edge Function or Resend to deliver key by email
        // For now the key is stored and retrievable from dashboard.
        // Example: await fetch(process.env.RESEND_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ to: email, key: sandboxKey }) })

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[sandbox-key] error:', err);
        return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
    }
}

// ── Helpers ──────────────────────────────────────────────────────
function generateToken(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Use crypto.getRandomValues in a way compatible with Edge Runtime
    if (typeof globalThis.crypto !== 'undefined') {
        const arr = new Uint8Array(length);
        globalThis.crypto.getRandomValues(arr);
        return Array.from(arr, b => chars[b % chars.length]).join('');
    }
    // Node.js fallback
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
