import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Score Recompute Engine — Scheduled Edge Function
 * 
 * Runs daily (via cron):
 * 1. Batch-recomputes readiness scores for all escorts
 * 2. Logs every change with full signal breakdown
 * 3. Flags anomalies (>20pt swing) for manual review
 * 4. Sweeps the search reindex dead-letter queue
 * 5. Flags expiring compliance documents
 * 
 * Trigger via: POST /functions/v1/score-recompute
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const results: Record<string, unknown> = {}

        // ── Step 1: Batch recompute readiness scores ──
        const { data: scoreResults, error: scoreErr } = await supabase.rpc(
            'batch_recompute_readiness_scores',
            { batch_limit: 200 }
        )

        if (scoreErr) {
            console.error('Score recompute error:', scoreErr)
            results.score_recompute = { error: scoreErr.message }
        } else {
            const anomalies = (scoreResults || []).filter((r: any) => r.is_anomaly)
            results.score_recompute = {
                total_recomputed: scoreResults?.length || 0,
                anomalies_flagged: anomalies.length
            }
        }

        // ── Step 2: Sweep dead-letter search queue ──
        const { data: deadLetterCount } = await supabase.rpc('sweep_dead_letter_queue')
        results.dead_letter_sweep = {
            moved_to_dead_letter: deadLetterCount ?? 0
        }

        // ── Step 3: Flag expiring compliance documents ──
        const { data: expiringCount } = await supabase.rpc('flag_expiring_documents', {
            warning_days: 30
        })
        results.compliance_check = {
            documents_flagged: expiringCount ?? 0
        }

        // ── Step 4: Recompute corridor supply indices ──
        const { data: corridors } = await supabase
            .from('corridors')
            .select('corridor_id')
            .limit(50)

        let corridorsRecomputed = 0
        if (corridors) {
            for (const c of corridors) {
                await supabase.rpc('recompute_corridor_supply_index', {
                    target_corridor_id: c.corridor_id
                }).catch(() => { })  // Non-fatal
                corridorsRecomputed++
            }
        }
        results.corridor_index = {
            corridors_recomputed: corridorsRecomputed
        }

        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            results
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Score recompute engine error:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
