import { NextResponse } from 'next/server';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';

// ── broker_intent_radar_v1 ────────────────────────────────────────────────
// Runs every 30 min. Computes broker post velocity + intent probability.

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();

    try {
        const { data: flag } = await sb.from('feature_flags').select('enabled').eq('name', 'control_tower_enabled').maybeSingle();
        if (!flag?.enabled) {
            await logCronRun('broker_intent_radar_v1', startMs, 'skipped', { metadata: { reason: 'flag_off' } });
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Fetch recent broker load posts — 7d velocity vs 24h velocity
        const { data: recentPosts } = await sb
            .from('load_posts')
            .select('broker_id, created_at')
            .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString())
            .not('broker_id', 'is', null);

        if (!recentPosts || recentPosts.length === 0) {
            await logCronRun('broker_intent_radar_v1', startMs, 'skipped', { metadata: { reason: 'no_posts' } });
            return NextResponse.json({ ok: true, skipped: true, reason: 'no_recent_posts' });
        }

        const cutoff24h = Date.now() - 86400_000;

        // Aggregate per broker
        const brokerMap = new Map<string, { velocity_7d: number; velocity_24h: number }>();
        for (const p of recentPosts) {
            const bid = p.broker_id as string;
            const entry = brokerMap.get(bid) ?? { velocity_7d: 0, velocity_24h: 0 };
            entry.velocity_7d++;
            if (new Date(p.created_at).getTime() >= cutoff24h) entry.velocity_24h++;
            brokerMap.set(bid, entry);
        }

        // Score intent: acceleration spike = high intent
        const scores = Array.from(brokerMap.entries()).map(([broker_id, v]) => {
            const weekly_avg = v.velocity_7d / 7;
            const spike_ratio = weekly_avg > 0 ? v.velocity_24h / weekly_avg : v.velocity_24h;
            const intent_probability = Math.min(1, Math.max(0, 0.3 + spike_ratio * 0.2 + (v.velocity_24h > 3 ? 0.3 : 0)));
            return {
                broker_id,
                post_velocity_7d: v.velocity_7d,
                post_velocity_24h: v.velocity_24h,
                intent_probability,
                computed_at: new Date().toISOString(),
            };
        });

        // Upsert broker_intent_scores (table created in behavioral_moat migration)
        if (scores.length > 0) {
            await sb.from('broker_intent_scores').upsert(scores, { onConflict: 'broker_id' });
        }

        await logCronRun('broker_intent_radar_v1', startMs, 'success', {
            rows_affected: scores.length,
            metadata: { brokers_scored: scores.length },
        });

        return NextResponse.json({ ok: true, brokers_scored: scores.length });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('broker_intent_radar_v1', {}, msg);
        await logCronRun('broker_intent_radar_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
