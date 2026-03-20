import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// OPERATOR ACQUISITION — Listmonk Email Outreach
//
// Finds unclaimed operators in directory_listings and seeds them
// into Listmonk for the "Claim Your Profile" email sequence.
//
// POST /api/outreach/operators
//   Queues up to `limit` (default 50) unclaimed operators
//
// Requires LISTMONK_API_PASSWORD env var to be set.
// LISTMONK_URL and LISTMONK_API_USER are already set in .env.local
// ═══════════════════════════════════════════════════════════════

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LISTMONK_URL = process.env.LISTMONK_URL ?? '';
const LISTMONK_USER = process.env.LISTMONK_API_USER ?? 'admin';
const LISTMONK_PASS = process.env.LISTMONK_API_PASSWORD ?? '';

// Listmonk list ID for the "Operator Claim" campaign sequence
// Set this once you've created the list in your Listmonk instance
const OPERATOR_LIST_ID = Number(process.env.LISTMONK_OPERATOR_LIST_ID ?? 1);

interface ListmonkSubscriber {
    email: string;
    name: string;
    status: 'enabled';
    lists: number[];
    attribs: Record<string, string>;
    preconfirm_subscriptions: boolean;
}

async function addToListmonk(sub: ListmonkSubscriber): Promise<{ id: number } | null> {
    if (!LISTMONK_PASS) {
        // Password not configured — log and skip (don't throw)
        console.warn('[outreach] LISTMONK_API_PASSWORD not set — skipping Listmonk push');
        return null;
    }

    const auth = Buffer.from(`${LISTMONK_USER}:${LISTMONK_PASS}`).toString('base64');
    const res = await fetch(`${LISTMONK_URL}/api/subscribers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(sub),
    });

    if (res.status === 409) {
        // Already subscribed — not an error
        return { id: -1 };
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[outreach] Listmonk error:', res.status, text);
        return null;
    }

    const data = await res.json();
    return { id: data?.data?.id ?? -1 };
}

export async function POST(req: NextRequest) {
    // Protect with CRON_SECRET or HC_ADMIN_SECRET
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const validTokens = [
        process.env.CRON_SECRET,
        process.env.HC_ADMIN_SECRET,
    ].filter(Boolean);

    if (!validTokens.includes(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit ?? 50), 200);
    const campaignType = String(body.campaign_type ?? 'claim_profile');

    // ── Find unclaimed operators with email not yet outreached
    const { data: alreadySent } = await supabase
        .from('operator_outreach_log')
        .select('operator_id')
        .eq('campaign_type', campaignType);

    const sentIds = new Set((alreadySent ?? []).map((r: any) => r.operator_id));

    const { data: operators, error } = await supabase
        .from('directory_listings')
        .select('id, company_name, contact_email, state_code, region_code, services')
        .not('contact_email', 'is', null)
        .neq('contact_email', '')
        .eq('is_claimed', false)
        .order('created_at', { ascending: true })
        .limit(limit * 3); // Over-fetch to allow filtering already-sent

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const eligible = (operators ?? [])
        .filter((op: any) => !sentIds.has(op.id))
        .slice(0, limit);

    if (eligible.length === 0) {
        return NextResponse.json({ queued: 0, message: 'No new operators to reach' });
    }

    // ── Process each operator
    const results = await Promise.allSettled(
        eligible.map(async (op: any) => {
            const subResult = await addToListmonk({
                email: op.contact_email,
                name: op.company_name ?? 'Pilot Car Operator',
                status: 'enabled',
                lists: [OPERATOR_LIST_ID],
                attribs: {
                    company_name: op.company_name ?? '',
                    state: op.state_code ?? op.region_code ?? '',
                    claim_url: `https://haulcommand.com/claim?id=${op.id}`,
                    directory_url: `https://haulcommand.com/directory`,
                    services: Array.isArray(op.services) ? op.services.join(', ') : '',
                },
                preconfirm_subscriptions: true,
            });

            // Log the outreach attempt
            await supabase.from('operator_outreach_log').insert({
                operator_id: op.id,
                operator_name: op.company_name ?? null,
                email: op.contact_email,
                listmonk_sub_id: subResult?.id ?? null,
                campaign_type: campaignType,
                status: subResult !== null ? 'sent' : 'queued',
                sent_at: subResult !== null ? new Date().toISOString() : null,
            });

            return { id: op.id, email: op.contact_email, status: subResult !== null ? 'sent' : 'queued' };
        })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
        queued: eligible.length,
        sent,
        failed,
        listmonk_configured: !!LISTMONK_PASS,
        message: LISTMONK_PASS
            ? `${sent} operators added to Listmonk "${campaignType}" sequence`
            : `${sent} operators logged (Listmonk password not set — set LISTMONK_API_PASSWORD to activate sends)`,
    });
}

// GET — preview which operators would be targeted (dry run)
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const validTokens = [process.env.CRON_SECRET, process.env.HC_ADMIN_SECRET].filter(Boolean);
    if (!validTokens.includes(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 10), 50);

    const { data: operators, count } = await supabase
        .from('directory_listings')
        .select('id, company_name, contact_email, state_code, is_claimed', { count: 'exact' })
        .not('contact_email', 'is', null)
        .neq('contact_email', '')
        .eq('is_claimed', false)
        .limit(limit);

    return NextResponse.json({
        preview: operators ?? [],
        total_eligible: count ?? 0,
        listmonk_configured: !!LISTMONK_PASS,
        listmonk_url: LISTMONK_URL || '(not set)',
    });
}
