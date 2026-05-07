import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, isResendConfigured } from '@/lib/email/bulk';
import { captureError } from '@/lib/monitoring/error';
import { computeClaimReadiness, type ClaimReadinessResult } from '@/lib/engines/claim-readiness';

// ═══════════════════════════════════════════════════════════════
// OPERATOR ACQUISITION — Resend-native Email Outreach
//
// Finds unclaimed operators in directory_listings and sends them
// the "Claim Your Profile" email via Resend (primary) or Listmonk (optional).
//
// POST /api/outreach/operators
//   Queues up to `limit` (default 50) unclaimed operators
//
// Primary sender: RESEND_API_KEY (already configured)
// Optional: LISTMONK_API_PASSWORD for Listmonk sync
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
    if (!LISTMONK_PASS) return null; // Listmonk not configured — use Resend instead

    try {
        const auth = Buffer.from(`${LISTMONK_USER}:${LISTMONK_PASS}`).toString('base64');
        const res = await fetch(`${LISTMONK_URL}/api/subscribers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
            body: JSON.stringify(sub),
        });

        if (res.status === 409) return { id: -1 };
        if (!res.ok) return null;
        const data = await res.json();
        return { id: data?.data?.id ?? -1 };
    } catch {
        return null;
    }
}

// Claim email template for direct Resend sends
function buildClaimEmail(name: string, state: string, claimUrl: string): string {
    return `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #C6923A; margin-bottom: 20px;">HAUL COMMAND</div>
        <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 16px; color: #fff;">Your profile is ready to claim</h1>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 16px;">
            Hey ${name}, we've created a directory profile for you based on public licensing records in <strong style="color: #f5b942;">${state}</strong>.
        </p>
        <p style="font-size: 14px; color: #8fa3b8; line-height: 1.7; margin: 0 0 24px;">
            <strong style="color: #fff;">Claim it free</strong> to add your phone number, services, and get the verified badge \u2713 that gets you 5\u00d7 more job requests.
        </p>
        <a href="${claimUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(135deg, #C6923A, #8A6428); color: #000; font-weight: 800; font-size: 14px; text-decoration: none;">Claim Your Profile \u2192</a>
        <p style="font-size: 11px; color: #556070; margin-top: 24px;">
            <a href="https://haulcommand.com/unsubscribe" style="color: #556070;">Unsubscribe</a>
        </p>
    </div>`;
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
        .from('hc_global_operators')
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
        .slice(0, limit * 2); // Over-select for readiness filtering

    // ── Claim Readiness Scoring ── Prioritize high-value outreach targets
    const scoredOperators = eligible.map((op: any) => {
        const readiness = computeClaimReadiness({
            surface_id: op.id,
            operator_id: op.id,
            impressions_30d: 0,
            search_impressions_30d: 0,
            profile_views_30d: 0,
            profile_completion_pct: 20,
            has_photo: false,
            has_reviews: false,
            review_count: 0,
            trust_score: 0,
            related_page_count: 1,
            internal_links_count: 1,
            corridor_placements: 0,
            is_claimed: false,
            claim_status: 'unclaimed',
            role_type: 'pilot_car_operator',
            country_code: op.region_code ?? 'US',
            state: op.state_code ?? '',
            city: '',
            nearby_sponsors: 0,
            corridor_sponsor_demand: 0,
        });
        return { ...op, readiness };
    });

    // Filter out suppressed operators + sort by readiness score (highest first)
    const prioritized = scoredOperators
        .filter(op => op.readiness.outreach_state !== 'suppress')
        .sort((a, b) => b.readiness.readiness_score - a.readiness.readiness_score)
        .slice(0, limit);

    if (prioritized.length === 0) {
        return NextResponse.json({ queued: 0, message: 'No ready operators to reach (all below readiness threshold)' });
    }

    // ── Process each operator
    const results = await Promise.allSettled(
        prioritized.map(async (op: any) => {
            const name = op.company_name ?? 'Pilot Car Operator';
            const state = op.state_code ?? op.region_code ?? 'US';
            const claimUrl = `https://haulcommand.com/claim?id=${op.id}`;
            let sendStatus = 'queued';

            // Primary: send via Resend
            if (isResendConfigured()) {
                const result = await sendEmail(
                    op.contact_email,
                    `${name}, your Haul Command profile is ready to claim`,
                    buildClaimEmail(name, state, claimUrl),
                    { tags: [{ name: 'campaign', value: campaignType }] }
                );
                sendStatus = result.ok ? 'sent' : `resend_error: ${result.error?.slice(0, 40)}`;
            }

            // Optional: also add to Listmonk for drip campaigns if configured
            const listmonkResult = await addToListmonk({
                email: op.contact_email,
                name,
                status: 'enabled',
                lists: [OPERATOR_LIST_ID],
                attribs: {
                    company_name: name,
                    state,
                    claim_url: claimUrl,
                    directory_url: `https://haulcommand.com/directory`,
                    services: Array.isArray(op.services) ? op.services.join(', ') : '',
                },
                preconfirm_subscriptions: true,
            });

            // Log the outreach attempt
            await supabase.from('operator_outreach_log').insert({
                operator_id: op.id,
                operator_name: name,
                email: op.contact_email,
                listmonk_sub_id: listmonkResult?.id ?? null,
                campaign_type: campaignType,
                status: sendStatus,
                sent_at: sendStatus === 'sent' ? new Date().toISOString() : null,
            });

            return {
                id: op.id,
                email: op.contact_email,
                status: sendStatus,
                readiness_score: op.readiness.readiness_score,
                outreach_state: op.readiness.outreach_state,
            };
        })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
        queued: prioritized.length,
        sent,
        failed,
        resend_configured: isResendConfigured(),
        listmonk_configured: !!LISTMONK_PASS,
        message: isResendConfigured()
            ? `${sent} operators emailed via Resend (${LISTMONK_PASS ? '+ synced to Listmonk' : 'Listmonk not configured'})`
            : `${sent} operators logged (no email sender configured — set RESEND_API_KEY)`,
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
        .from('hc_global_operators')
        .select('id, company_name, contact_email, state_code, is_claimed', { count: 'exact' })
        .not('contact_email', 'is', null)
        .neq('contact_email', '')
        .eq('is_claimed', false)
        .limit(limit);

    return NextResponse.json({
        preview: operators ?? [],
        total_eligible: count ?? 0,
        resend_configured: isResendConfigured(),
        listmonk_configured: !!LISTMONK_PASS,
        sender: isResendConfigured() ? 'Resend (primary)' : LISTMONK_PASS ? 'Listmonk' : 'None configured',
    });
}
