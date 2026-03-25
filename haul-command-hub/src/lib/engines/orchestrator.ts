/**
 * lib/engines/orchestrator.ts
 * 
 * HAUL COMMAND — AI ORCHESTRATION ENGINE (PRODUCTION)
 * 
 * Multi-model autonomous orchestration layer.
 * Selects optimal model, executes with enriched context,
 * evaluates output, stores metrics, and self-improves over time.
 */

import { supabaseServer } from '@/lib/supabase-server';
import { selectModel, createHybridExecutionPlan, estimateCost } from './model-router';
import type { RouteInput, TaskCategory } from './model-router';

// ─── Types ──────────────────────────────────────────────────────

export type TaskIntent =
  | 'code_generation'
  | 'debugging'
  | 'architecture_design'
  | 'mobile_build'
  | 'scraping'
  | 'research'
  | 'summarization'
  | 'dispatch'
  | 'pricing'
  | 'enrichment';

export type TaskComplexity = 'low' | 'medium' | 'high';
export type ExecutionMode = 'single' | 'pipeline' | 'swarm';

export interface OrchestratorInput {
  prompt: string;
  userId?: string;
  orgId?: string;
  priority?: number; // 1-10
  intent?: TaskIntent;
  files?: string[];
  metadata?: Record<string, unknown>;
  mode?: ExecutionMode;
  country?: string;
}

export interface OrchestratorOutput {
  result: string;
  modelUsed: string;
  confidence: number;
  cost: number;
  latencyMs: number;
  pipeline?: string[];
  taskId?: string;
}

// ─── Classification Engine ───────────────────────────────────────

function classifyTask(input: OrchestratorInput): {
  complexity: TaskComplexity;
  category: TaskCategory;
  autonomyScore: number;
  riskScore: number;
} {
  const { prompt, intent } = input;
  const tokens = prompt.split(' ').length;

  const complexity: TaskComplexity = 
    tokens > 300 ? 'high' : tokens > 80 ? 'medium' : 'low';

  // Map intent → model router category
  const categoryMap: Record<TaskIntent, TaskCategory> = {
    code_generation: 'code_generation',
    debugging: 'code_generation',
    architecture_design: 'system_design',
    mobile_build: 'long_form_analysis',
    scraping: 'batch_data_processing',
    research: 'long_form_analysis',
    summarization: 'long_form_analysis',
    dispatch: 'structured_reasoning',
    pricing: 'structured_reasoning',
    enrichment: 'geo_enrichment',
  };

  const category: TaskCategory = intent ? categoryMap[intent] : 'structured_reasoning';

  return {
    complexity,
    category,
    autonomyScore: complexity === 'high' ? 0.9 : complexity === 'medium' ? 0.6 : 0.3,
    riskScore: (intent === 'architecture_design' || intent === 'mobile_build') ? 0.8 : 0.3,
  };
}

// ─── Context Enrichment ──────────────────────────────────────────

async function enrichContext(input: OrchestratorInput): Promise<string> {
  let enriched = input.prompt;

  // Inject country context if applicable
  if (input.country) {
    enriched = `[Region: ${input.country.toUpperCase()}] ${enriched}`;
  }

  // Inject org context
  if (input.orgId) {
    enriched = `[Org: ${input.orgId}] ${enriched}`;
  }

  // Retrieve top-3 similar successful patterns from memory
  try {
    const sb = supabaseServer();
    const { data: memories } = await sb
      .from('ai_task_memory')
      .select('successful_pattern, outcome_score')
      .order('outcome_score', { ascending: false })
      .limit(3);

    if (memories && memories.length > 0) {
      const patterns = memories.map(m => m.successful_pattern).join(' | ');
      enriched = `${enriched}\n[Similar successful patterns]: ${patterns}`;
    }
  } catch {
    // Memory table may not exist yet — skip silently
  }

  return enriched;
}

// ─── Execution Engine ────────────────────────────────────────────

async function executeWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function executeWithClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`Claude error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function executeWithGPT(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`GPT error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function executeModel(provider: string, prompt: string): Promise<string> {
  switch (provider) {
    case 'gemini': return executeWithGemini(prompt);
    case 'claude': return executeWithClaude(prompt);
    case 'gpt': return executeWithGPT(prompt);
    default: return executeWithGemini(prompt);
  }
}

// ─── Output Evaluation ────────────────────────────────────────────

function evaluateOutput(output: string, intent?: TaskIntent): number {
  if (!output || output.length < 10) return 0.1;

  let score = 0.6; // Base

  if (output.length > 200) score += 0.1;
  if (output.length > 500) score += 0.1;

  // Code outputs should look like code
  if (intent === 'code_generation' || intent === 'debugging') {
    if (output.includes('```') || output.includes('function') || output.includes('const')) {
      score += 0.15;
    }
  }

  // Architecture outputs should have structure
  if (intent === 'architecture_design') {
    if (output.includes('\n') || output.includes('##') || output.includes('1.')) {
      score += 0.15;
    }
  }

  return Math.min(score, 1.0);
}

// ─── Metrics Storage ──────────────────────────────────────────────

async function storeMetrics(params: {
  taskId: string;
  prompt: string;
  model: string;
  result: string;
  cost: number;
  latencyMs: number;
  confidence: number;
  userId?: string;
}) {
  try {
    const sb = supabaseServer();
    await sb.from('ai_orchestration_runs').insert({
      task_id: params.taskId,
      prompt_hash: Buffer.from(params.prompt.slice(0, 100)).toString('base64'),
      model_used: params.model,
      output_length: params.result.length,
      cost_usd: params.cost,
      latency_ms: params.latencyMs,
      confidence_score: params.confidence,
      user_id: params.userId ?? null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Don't throw on metrics failure — silent
  }
}

// ─── Event Emission ───────────────────────────────────────────────

async function emitEvent(type: string, payload: Record<string, unknown>) {
  try {
    const sb = supabaseServer();
    await sb.from('events').insert({
      type,
      source: 'orchestrator',
      payload,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Silent
  }
}

// ─── MAIN ORCHESTRATOR ────────────────────────────────────────────

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const taskId = crypto.randomUUID();
  const start = Date.now();

  await emitEvent('task_received', { taskId, intent: input.intent, priority: input.priority });

  // 1. Classify
  const { complexity, category, riskScore } = classifyTask(input);

  // 2. Enrich context
  const enrichedPrompt = await enrichContext(input);

  // 3. Select model
  const routeInput: RouteInput = {
    task_type: category,
    prompt: enrichedPrompt,
    token_estimate: enrichedPrompt.split(' ').length,
    constraints: {
      cost_priority: complexity === 'low' ? 'high' : 'medium',
      latency_priority: (input.priority ?? 5) >= 8 ? 'high' : 'medium',
      quality_priority: riskScore > 0.7 ? 'high' : 'medium',
    }
  };

  const selectedModel = selectModel(routeInput);
  await emitEvent('model_selected', { taskId, model: selectedModel.provider });

  let result = '';
  const pipelineUsed: string[] = [];

  try {
    if (input.mode === 'pipeline' || riskScore > 0.7) {
      // Multi-pass pipeline for high-risk or explicit pipeline requests
      const plan = createHybridExecutionPlan(category);

      const step1Result = await executeModel(
        (plan as any).step1?.provider ?? selectedModel.provider,
        enrichedPrompt
      );
      pipelineUsed.push((plan as any).step1?.provider ?? selectedModel.provider);

      if ((plan as any).step2) {
        const refinedPrompt = `Refine and improve this output:\n\n${step1Result}\n\nOriginal task: ${enrichedPrompt}`;
        result = await executeModel((plan as any).step2.provider, refinedPrompt);
        pipelineUsed.push((plan as any).step2.provider);
      } else {
        result = step1Result;
      }
    } else {
      // Single model execution (fast lane)
      result = await executeModel(selectedModel.provider, enrichedPrompt);
      pipelineUsed.push(selectedModel.provider);
    }

    await emitEvent('execution_completed', { taskId, model: selectedModel.provider });
  } catch (err: any) {
    // Retry with fallback model
    await emitEvent('model_failed', { taskId, model: selectedModel.provider, error: err.message });
    const fallbackProvider = selectedModel.provider === 'gemini' ? 'claude' : 'gemini';
    result = await executeModel(fallbackProvider, enrichedPrompt);
    pipelineUsed.push(`${fallbackProvider}(fallback)`);
  }

  // 4. Evaluate
  const confidence = evaluateOutput(result, input.intent);
  const latencyMs = Date.now() - start;
  const cost = estimateCost(selectedModel.provider, enrichedPrompt.split(' ').length + result.split(' ').length);

  // 5. Store metrics
  await storeMetrics({
    taskId, prompt: input.prompt, model: pipelineUsed.join('+'),
    result, cost, latencyMs, confidence, userId: input.userId,
  });

  await emitEvent('evaluation_completed', { taskId, confidence, cost, latencyMs });

  return {
    result,
    modelUsed: pipelineUsed.join(' → '),
    confidence,
    cost,
    latencyMs,
    pipeline: pipelineUsed,
    taskId,
  };
}
