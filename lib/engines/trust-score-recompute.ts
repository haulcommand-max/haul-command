/**
 * HAUL COMMAND: TRUST SCORE RECOMPUTE ENGINE (PENDING EDGE FUNCTION DEPLOYMENT)
 * Implements the exact algorithm specified in SCHEMA.md:
 * trust_score = 0.20*review + 0.20*completion + 0.15*cancel + 0.15*clean_run + 0.10*response + 0.10*compliance + 0.05*tenure + 0.05*funds
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function recomputeAllDriverTrustScores() {
  console.log('[TRUST_ENGINE] Starting daily batch trust score recomputation...');

  const { data: profiles, error } = await supabase.from('profiles').select('id').eq('role', 'driver');
  if (error || !profiles) throw error;

  let computed = 0;
  for (const driver of profiles) {
    // 1. Fetch live metrics (Aggregated natively via Views or subqueries)
    const { data: stats } = await supabase.rpc('get_driver_metrics', { target_driver_id: driver.id });
    
    if (stats) {
       const trust_score = 
         (0.20 * (stats.avg_review / 5.0)) +
         (0.20 * stats.completion_rate) +
         (0.15 * (1.0 - stats.cancel_rate)) + 
         (0.15 * stats.clean_run_score) +
         (0.10 * stats.response_score) +
         (0.10 * stats.compliance_score) +
         (0.05 * stats.job_tenure_score) +
         (0.05 * stats.funds_verified);

       await supabase.from('driver_trust_scores').upsert({
         driver_id: driver.id,
         trust_score: Number(trust_score.toFixed(4)),
         review_quality: Number((stats.avg_review / 5.0).toFixed(4)),
         completion_rate: Number(stats.completion_rate.toFixed(4)),
         cancel_rate_inv: Number((1.0 - stats.cancel_rate).toFixed(4)),
         clean_run_score: Number(stats.clean_run_score.toFixed(4)),
         response_score: Number(stats.response_score.toFixed(4)),
         compliance_score: Number(stats.compliance_score.toFixed(4)),
         job_tenure_score: Number(stats.job_tenure_score.toFixed(4)),
         funds_verified: Number(stats.funds_verified.toFixed(4)),
         computed_at: new Date().toISOString()
       }, { onConflict: 'driver_id' });
       computed++;
    }
  }

  console.log(`[TRUST_ENGINE] Completed processing for ${computed} drivers.`);
  return { success: true, processed: computed };
}
