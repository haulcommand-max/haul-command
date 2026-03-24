/**
 * HAUL COMMAND — AI USAGE TRACKER
 * 
 * Logs every AI call to ai_usage_log table for:
 * - Cost monitoring per feature
 * - Latency tracking per brain
 * - Model performance comparison
 * - Per-user/per-feature budget enforcement
 */

import { createClient } from '@/lib/supabase/server';
import type { AIResult, Brain, SpeedTier } from './brain';

export interface UsageLog {
  brain: Brain;
  model: string;
  feature: string; // e.g. 'content_engine', 'dispatch_match', 'ad_copy'
  user_id?: string;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  latency_ms: number;
  success: boolean;
  error?: string;
}

export async function logAIUsage(log: UsageLog) {
  try {
    const supabase = createClient();
    await supabase.from('ai_usage_log').insert({
      brain: log.brain,
      model: log.model,
      feature: log.feature,
      user_id: log.user_id ?? null,
      input_tokens: log.input_tokens ?? 0,
      output_tokens: log.output_tokens ?? 0,
      cost_cents: log.cost_cents ?? 0,
      latency_ms: log.latency_ms ?? 0,
      success: log.success,
      error: log.error ?? null,
    });
  } catch (err) {
    // Non-fatal — never crash the main request due to logging
    console.error('[ai-tracker] Log failed:', err);
  }
}

/** Wrap any brain call with automatic usage tracking */
export async function tracked<T extends AIResult>(
  feature: string,
  call: () => Promise<T>,
  user_id?: string
): Promise<T> {
  const start = Date.now();
  let result: T;
  let success = true;
  let error: string | undefined;

  try {
    result = await call();
  } catch (err: any) {
    success = false;
    error = String(err);
    throw err;
  } finally {
    const latency = Date.now() - start;
    // @ts-ignore
    if (result) {
      await logAIUsage({
        brain: result.brain,
        model: result.model,
        feature,
        user_id,
        input_tokens: result.input_tokens ?? 0,
        output_tokens: result.output_tokens ?? 0,
        cost_cents: result.cost_cents ?? 0,
        latency_ms: result.latency_ms ?? latency,
        success,
        error,
      });
    }
  }

  return result!;
}
