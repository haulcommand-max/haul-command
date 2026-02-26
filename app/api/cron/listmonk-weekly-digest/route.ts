import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── listmonk_weekly_digest_v1 ─────────────────────────────────────────────
// Fires every Monday at 14:00 UTC
// Sends weekly digest via Listmonk API to segmented lists:
//   - escorts: hot corridors + reposition opportunities
//   - brokers:  recent available escorts + platform news

const LISTMONK_URL = process.env.LISTMONK_URL ?? '';     // e.g. https://mail.haulcommand.com
const LISTMONK_USER = process.env.LISTMONK_USER ?? '';
const LISTMONK_PASS = process.env.LISTMONK_PASS ?? '';

// Listmonk list IDs (set these after Listmonk is deployed)
const LIST_IDS = {
    escorts: Number(process.env.LISTMONK_LIST_ESCORTS ?? '0'),
    brokers: Number(process.env.LISTMONK_LIST_BROKERS ?? '0'),
};

async function listmonkPost(path: string, body: unknown) {
    if (!LISTMONK_URL || !LISTMONK_USER) throw new Error('Listmonk not configured');
    const res = await fetch(`${LISTMONK_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + Buffer.from(`${LISTMONK_USER}:${LISTMONK_PASS}`).toString('base64'),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Listmonk ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();
    const campaignIds: number[] = [];

    try {
        // Gather digest data
        const { data: hotCorridors } = await sb
            .from('corridor_scarcity_index')
            .select('corridor_slug, scarcity_index')
            .gte('scarcity_index', 50)
            .order('scarcity_index', { ascending: false })
            .limit(5);

        const { data: recentEscorts } = await sb
            .from('driver_profiles')
            .select('display_name, company_name, region_code, trust_score')
            .gte('trust_score', 60)
            .order('updated_at', { ascending: false })
            .limit(10);

        const hotCorridorList = (hotCorridors ?? [])
            .map(c => `• ${c.corridor_slug} (pressure: ${Math.round(c.scarcity_index)}/100)`)
            .join('\n') || '• No critical shortages this week — markets balanced';

        const escortList = (recentEscorts ?? [])
            .map(e => `• ${e.company_name ?? e.display_name ?? 'Unknown'} — ${e.region_code ?? 'Multi-region'}`)
            .join('\n') || '• New escorts joining the network';

        const weekStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // ── Escort campaign ──────────────────────────────────────────────
        if (LISTMONK_URL && LIST_IDS.escorts > 0) {
            const escortCampaign = await listmonkPost('/api/campaigns', {
                name: `Weekly Escort Digest — ${weekStr}`,
                subject: `Your week on Haul Command: Hot corridors + open loads`,
                lists: [LIST_IDS.escorts],
                type: 'regular',
                content_type: 'plain',
                body: `Haul Command Weekly Digest — ${weekStr}\n\n` +
                    `🔥 HOT CORRIDORS THIS WEEK:\n${hotCorridorList}\n\n` +
                    `These corridors have active load demand. Log in to see available loads.\n\n` +
                    `View your dashboard: https://haulcommand.com/profile\n\n` +
                    `---\nTo unsubscribe: {{ UnsubscribeURL }}`,
                send_at: new Date().toISOString(),
            });
            // Start the campaign
            await listmonkPost(`/api/campaigns/${escortCampaign.data.id}/status`, { status: 'running' });
            campaignIds.push(escortCampaign.data.id);
        }

        // ── Broker campaign ──────────────────────────────────────────────
        if (LISTMONK_URL && LIST_IDS.brokers > 0) {
            const brokerCampaign = await listmonkPost('/api/campaigns', {
                name: `Weekly Broker Digest — ${weekStr}`,
                subject: `Available pilot cars near your corridors this week`,
                lists: [LIST_IDS.brokers],
                type: 'regular',
                content_type: 'plain',
                body: `Haul Command Weekly Digest — ${weekStr}\n\n` +
                    `🚗 ACTIVE ESCORTS IN NETWORK:\n${escortList}\n\n` +
                    `Find and book verified pilot car operators instantly.\n\n` +
                    `Browse directory: https://haulcommand.com/directory\n` +
                    `Post a load: https://haulcommand.com/post-a-load\n\n` +
                    `---\nTo unsubscribe: {{ UnsubscribeURL }}`,
                send_at: new Date().toISOString(),
            });
            await listmonkPost(`/api/campaigns/${brokerCampaign.data.id}/status`, { status: 'running' });
            campaignIds.push(brokerCampaign.data.id);
        }

        await logCronRun('listmonk_weekly_digest_v1', startMs, 'success', {
            rows_affected: campaignIds.length,
            metadata: { campaign_ids: campaignIds, listmonk_configured: !!LISTMONK_URL },
        });

        return NextResponse.json({
            ok: true,
            campaigns_sent: campaignIds.length,
            campaign_ids: campaignIds,
            listmonk_configured: !!LISTMONK_URL,
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('listmonk_weekly_digest_v1', { week: new Date().toISOString() }, msg);
        await logCronRun('listmonk_weekly_digest_v1', startMs, 'failed', { error_message: msg });
        // Don't 500 on email failure — log it but return gracefully
        return NextResponse.json({ ok: false, error: msg, campaigns_sent: campaignIds.length });
    }
}
