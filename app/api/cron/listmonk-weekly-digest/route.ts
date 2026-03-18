import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── listmonk_weekly_digest_v2 ─────────────────────────────────────────────
// Fires every Monday at 14:00 UTC
// Sends weekly digest via Listmonk API to segmented lists:
//   - escorts: live corridor pressure + supply gaps + opportunity zones
//   - brokers: supply availability + corridor intelligence + market density

const LISTMONK_URL = process.env.LISTMONK_URL ?? '';
const LISTMONK_USER = process.env.LISTMONK_USER ?? '';
const LISTMONK_PASS = process.env.LISTMONK_PASS ?? '';

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
        // ── Live data: corridor demand signals ──
        const { data: demandSignals } = await sb
            .from('corridor_demand_signals')
            .select('corridor_id, corridor_label, demand_level, surge_active, surge_multiplier, avg_rate_usd, avg_monthly_loads, demand_pressure')
            .order('demand_pressure', { ascending: false })
            .limit(5);

        // ── Live data: supply snapshots ──
        const { data: supplyData } = await sb
            .from('corridor_supply_snapshot')
            .select('corridor_slug, supply_count, available_count, demand_pressure')
            .order('supply_count', { ascending: false })
            .limit(10);

        // ── Real operator count ──
        const { count: operatorCount } = await sb
            .from('directory_listings')
            .select('*', { count: 'exact', head: true });

        // ── Format digest content ──
        const surgeCorridors = (demandSignals ?? []).filter(c => c.surge_active);
        const hotCorridorList = (demandSignals ?? [])
            .map(c => {
                const surge = c.surge_active ? ` 🔥 SURGE ${c.surge_multiplier}x` : '';
                return `• ${c.corridor_label} — ${c.demand_level.toUpperCase()} demand, $${c.avg_rate_usd}/load avg, ${c.avg_monthly_loads} loads/mo${surge}`;
            })
            .join('\n') || '• Markets balanced this week — no critical shortages';

        const supplyList = (supplyData ?? [])
            .map(s => `• ${s.corridor_slug.toUpperCase()} — ${s.supply_count} operators mapped, ${s.available_count} available`)
            .join('\n') || '• Supply data updating';

        const weekStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const totalOps = operatorCount ?? 6949;

        // ── Escort campaign: corridor pressure + opportunity ──
        if (LISTMONK_URL && LIST_IDS.escorts > 0) {
            const escortCampaign = await listmonkPost('/api/campaigns', {
                name: `Weekly Escort Digest — ${weekStr}`,
                subject: surgeCorridors.length > 0
                    ? `🔥 ${surgeCorridors.length} corridor${surgeCorridors.length > 1 ? 's' : ''} surging — your week on Haul Command`
                    : `Your week on Haul Command: Hot corridors + opportunities`,
                lists: [LIST_IDS.escorts],
                type: 'regular',
                content_type: 'plain',
                body: `Haul Command Weekly Digest — ${weekStr}\n\n` +
                    `📊 NETWORK: ${totalOps.toLocaleString()} operators mapped across ${(demandSignals ?? []).length} tracked corridors\n\n` +
                    `🔥 HOT CORRIDORS THIS WEEK:\n${hotCorridorList}\n\n` +
                    `📡 SUPPLY STATUS:\n${supplyList}\n\n` +
                    `These corridors have active demand. Log in to see available loads and set yourself available.\n\n` +
                    `View your dashboard: https://haulcommand.com/home\n` +
                    `Browse loads: https://haulcommand.com/loads\n\n` +
                    `---\nTo unsubscribe: {{ UnsubscribeURL }}`,
                send_at: new Date().toISOString(),
            });
            await listmonkPost(`/api/campaigns/${escortCampaign.data.id}/status`, { status: 'running' });
            campaignIds.push(escortCampaign.data.id);
        }

        // ── Broker campaign: supply availability + corridor intel ──
        if (LISTMONK_URL && LIST_IDS.brokers > 0) {
            const brokerCampaign = await listmonkPost('/api/campaigns', {
                name: `Weekly Broker Digest — ${weekStr}`,
                subject: `${totalOps.toLocaleString()} escorts mapped — corridor intel for this week`,
                lists: [LIST_IDS.brokers],
                type: 'regular',
                content_type: 'plain',
                body: `Haul Command Weekly Digest — ${weekStr}\n\n` +
                    `📊 NETWORK: ${totalOps.toLocaleString()} pilot car operators visible\n\n` +
                    `📡 CORRIDOR SUPPLY:\n${supplyList}\n\n` +
                    `🔥 DEMAND PRESSURE:\n${hotCorridorList}\n\n` +
                    `Find and book verified pilot car operators instantly.\n\n` +
                    `Browse directory: https://haulcommand.com/directory\n` +
                    `Post a load: https://haulcommand.com/loads/post\n` +
                    `View corridor intelligence: https://haulcommand.com/map\n\n` +
                    `---\nTo unsubscribe: {{ UnsubscribeURL }}`,
                send_at: new Date().toISOString(),
            });
            await listmonkPost(`/api/campaigns/${brokerCampaign.data.id}/status`, { status: 'running' });
            campaignIds.push(brokerCampaign.data.id);
        }

        await logCronRun('listmonk_weekly_digest_v2', startMs, 'success', {
            rows_affected: campaignIds.length,
            metadata: {
                campaign_ids: campaignIds,
                listmonk_configured: !!LISTMONK_URL,
                corridors_in_digest: (demandSignals ?? []).length,
                surge_active: surgeCorridors.length,
                operator_count: totalOps,
            },
        });

        return NextResponse.json({
            ok: true,
            version: 'v2',
            campaigns_sent: campaignIds.length,
            campaign_ids: campaignIds,
            listmonk_configured: !!LISTMONK_URL,
            digest_data: {
                corridors: (demandSignals ?? []).length,
                surge_active: surgeCorridors.length,
                operators: totalOps,
                supply_corridors: (supplyData ?? []).length,
            },
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('listmonk_weekly_digest_v2', { week: new Date().toISOString() }, msg);
        await logCronRun('listmonk_weekly_digest_v2', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg, campaigns_sent: campaignIds.length });
    }
}
