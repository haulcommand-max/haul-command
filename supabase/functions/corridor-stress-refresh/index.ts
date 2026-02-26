// @ts-nocheck — Deno edge function, not compiled by Next.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// corridor-stress-refresh
// Scheduled edge function — run every 6 hours via Supabase cron or external scheduler
// Deploy: supabase functions deploy corridor-stress-refresh
// Schedule via Supabase Dashboard → Edge Functions → Schedule

const CORRIDORS = [
    { slug: 'i-95-northeast', region_a: 'FL', region_b: 'ME' },
    { slug: 'i-10-southern', region_a: 'CA', region_b: 'FL' },
    { slug: 'i-75-southeast', region_a: 'FL', region_b: 'MI' },
    { slug: 'i-80-transcontinental', region_a: 'CA', region_b: 'NJ' },
    { slug: 'i-40-southern-cross', region_a: 'CA', region_b: 'NC' },
    { slug: 'trans-canada-highway', region_a: 'BC', region_b: 'ON' },
];

Deno.serve(async (_req: Request) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Record<string, object> = {};

    for (const corridor of CORRIDORS) {
        try {
            // --- Active escort count ---
            let activeEscortCount = 0;
            const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // Try escort_presence heartbeat table first
            const { count: presenceCount, error: presenceErr } = await supabase
                .from('escort_presence')
                .select('id', { count: 'exact', head: true })
                .gte('last_seen', thirtyMinAgo);

            if (!presenceErr) {
                activeEscortCount = presenceCount ?? 0;
            } else {
                // Fallback: recently updated claimed profiles (estimate per corridor)
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('claimed', true)
                    .gte('updated_at', sevenDaysAgo);
                activeEscortCount = Math.round((count ?? 0) * 0.25); // rough per-corridor share
            }

            // --- Load count (24h, corridor states) ---
            let loadCount24h = 0;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: loadCount } = await supabase
                .from('loads')
                .select('id', { count: 'exact', head: true })
                .in('status', ['open', 'matched'])
                .gte('created_at', oneDayAgo)
                .or([
                    `origin_state.eq.${corridor.region_a}`,
                    `destination_state.eq.${corridor.region_a}`,
                    `origin_state.eq.${corridor.region_b}`,
                    `destination_state.eq.${corridor.region_b}`,
                ].join(','));
            loadCount24h = loadCount ?? 0;

            // --- Unfilled rate ---
            let unfilledRate = 0;
            const { count: totalJobs } = await supabase
                .from('escort_jobs')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', oneDayAgo);
            if (totalJobs && totalJobs > 0) {
                const { count: unfilledJobs } = await supabase
                    .from('escort_jobs')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'unmatched')
                    .gte('created_at', oneDayAgo);
                unfilledRate = ((unfilledJobs ?? 0) / totalJobs) * 100;
            }

            // --- Score computation ---
            const escortsPerHundredMi = Math.min(activeEscortCount / 5, 20);
            const pressureRatio = activeEscortCount > 0 ? loadCount24h / activeEscortCount : 0;

            // supply_density_score: invert escort density (low escort density = high stress)
            const supplyDensityScore = Math.max(0, Math.min(100,
                100 - ((escortsPerHundredMi / 6) * 100)
            ));

            // load_pressure_ratio: loads/escort ratio (>7 = 100 stress)
            const loadPressureScore = Math.max(0, Math.min(100,
                (pressureRatio / 7) * 100
            ));

            // activity_decay: fewer active escorts = higher decay
            const activityDecayScore = activeEscortCount < 2 ? 90
                : activeEscortCount < 4 ? 60
                    : activeEscortCount < 7 ? 30
                        : 10;

            // Weighted stress score (0–100)
            const stressScore = Math.round(
                (supplyDensityScore * 0.30) +
                (loadPressureScore * 0.25) +
                (activityDecayScore * 0.15) +
                (unfilledRate * 0.15)
                // response_time_drift + deadhead_inflation = reserved for Phase 3
            );

            const band =
                stressScore >= 80 ? 'critical' :
                    stressScore >= 60 ? 'at_risk' :
                        stressScore >= 40 ? 'tightening' :
                            'healthy';

            await supabase
                .from('corridor_stress_scores')
                .upsert({
                    corridor_slug: corridor.slug,
                    region_a: corridor.region_a,
                    region_b: corridor.region_b,
                    supply_density_score: supplyDensityScore,
                    load_pressure_ratio: loadPressureScore,
                    activity_decay_score: activityDecayScore,
                    unfilled_rate: unfilledRate,
                    response_time_drift: 0,
                    deadhead_inflation: 0,
                    stress_score: stressScore,
                    band,
                    escorts_per_100mi: escortsPerHundredMi,
                    active_escort_count: activeEscortCount,
                    load_count_24h: loadCount24h,
                    computed_at: new Date().toISOString(),
                }, { onConflict: 'corridor_slug' });

            results[corridor.slug] = { stressScore, band, activeEscortCount, loadCount24h };
        } catch (err: unknown) {
            results[corridor.slug] = { error: String(err) };
        }
    }

    return new Response(
        JSON.stringify({ ok: true, computed_at: new Date().toISOString(), results }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
