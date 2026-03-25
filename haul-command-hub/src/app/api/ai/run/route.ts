import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/engines/orchestrator';

/**
 * POST /api/ai/run
 * 
 * HAUL COMMAND — AI Orchestration API
 * 
 * The unified entry point for all AI tasks.
 * Routes to the optimal model, executes multi-model pipelines,
 * evaluates output, stores metrics, and returns enriched results.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { prompt, intent, mode, userId, orgId, priority, country, files } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const result = await runOrchestrator({
      prompt,
      intent,
      mode,
      userId,
      orgId,
      priority,
      country,
      files,
    });

    return NextResponse.json({
      success: true,
      result: result.result,
      model_used: result.modelUsed,
      confidence: result.confidence,
      cost_usd: result.cost,
      latency_ms: result.latencyMs,
      pipeline: result.pipeline,
      task_id: result.taskId,
    });
  } catch (err: any) {
    console.error('[/api/ai/run]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/ai/run',
    version: '2.0',
    models_supported: ['gemini', 'claude', 'gpt'],
    modes: ['single', 'pipeline', 'swarm'],
  });
}
