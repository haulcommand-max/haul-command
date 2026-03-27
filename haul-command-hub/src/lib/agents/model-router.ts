/**
 * Haul Command — AI Model Router
 * 
 * The BRAIN ROUTER. Every agent calls this — never picks its own model.
 * Routes tasks to the cheapest/fastest/best model for the job.
 * Logs cost + performance per request for continuous optimization.
 * 
 * Routing Strategy:
 *   OpenAI (GPT-4o)    → Pricing, decisions, negotiations, structured logic
 *   Claude (Sonnet)     → Documents, permits, legal text, long-context, copywriting
 *   Gemini (2.0 Flash)  → Search, scraping, enrichment, classification (cheapest)
 */

import { AIModel } from './types';

// ─── Task Categories ─────────────────────────────────────────────
export type TaskCategory =
  | 'pricing'           // Rate calculations, margin analysis, bid decisions
  | 'negotiation'       // Rate negotiation logic, counter-offers
  | 'decision'          // Business logic decisions, approvals
  | 'document_parse'    // PDF/image OCR, permit extraction
  | 'document_generate' // Contracts, invoices, reports
  | 'copywriting'       // Outreach emails, push notification copy
  | 'classification'    // Categorize operators, loads, services
  | 'enrichment'        // Data enrichment, profile completion
  | 'scraping'          // Web scraping normalization
  | 'search'            // Semantic search, fuzzy matching
  | 'anomaly_detection' // Fraud patterns, outlier detection
  | 'forecasting'       // Demand prediction, trend analysis
  | 'summarization'     // Log summaries, report generation
  | 'vision'            // Image analysis (equipment verification)
  | 'embedding';        // Vector embeddings for search

// ─── Model Routing Table ─────────────────────────────────────────
const ROUTE_TABLE: Record<TaskCategory, { primary: AIModel; fallback: AIModel }> = {
  pricing:           { primary: 'openai',  fallback: 'gemini' },
  negotiation:       { primary: 'openai',  fallback: 'claude' },
  decision:          { primary: 'openai',  fallback: 'gemini' },
  document_parse:    { primary: 'claude',  fallback: 'gemini' },
  document_generate: { primary: 'claude',  fallback: 'openai' },
  copywriting:       { primary: 'claude',  fallback: 'openai' },
  classification:    { primary: 'gemini',  fallback: 'openai' },
  enrichment:        { primary: 'gemini',  fallback: 'claude' },
  scraping:          { primary: 'gemini',  fallback: 'openai' },
  search:            { primary: 'gemini',  fallback: 'openai' },
  anomaly_detection: { primary: 'openai',  fallback: 'gemini' },
  forecasting:       { primary: 'openai',  fallback: 'claude' },
  summarization:     { primary: 'gemini',  fallback: 'claude' },
  vision:            { primary: 'gemini',  fallback: 'openai' },
  embedding:         { primary: 'openai',  fallback: 'gemini' },
};

// ─── Cost per 1M tokens (input/output) — 2026 pricing ───────────
const MODEL_COSTS: Record<Exclude<AIModel, 'none'>, { inputPer1M: number; outputPer1M: number }> = {
  openai: { inputPer1M: 2.50,  outputPer1M: 10.00 },  // GPT-4o
  claude: { inputPer1M: 3.00,  outputPer1M: 15.00 },  // Sonnet
  gemini: { inputPer1M: 0.075, outputPer1M: 0.30  },   // 2.0 Flash
};

// ─── Router Request / Response ───────────────────────────────────
export interface ModelRequest {
  task: TaskCategory;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  /** Force a specific model (override routing) */
  forceModel?: AIModel;
  /** Agent ID making the request (for logging) */
  agentId: number;
  /** Unique run ID (for cost tracking) */
  runId: string;
}

export interface ModelResponse {
  text: string;
  model: AIModel;
  tokensUsed: { input: number; output: number; total: number };
  costUSD: number;
  latencyMs: number;
  fromFallback: boolean;
}

// ─── Gemini Implementation ───────────────────────────────────────
async function callGemini(
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
): Promise<{ text: string; tokensUsed: { input: number; output: number } }> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');

  // Dynamic import to avoid build issues when not used
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: maxTokens || 2048,
    },
  });

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();

  // Estimate tokens (Gemini doesn't always return exact counts)
  const inputTokens = Math.ceil(fullPrompt.length / 4);
  const outputTokens = Math.ceil(text.length / 4);

  return { text, tokensUsed: { input: inputTokens, output: outputTokens } };
}

// ─── OpenAI Implementation ──────────────────────────────────────
async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<{ text: string; tokensUsed: { input: number; output: number } }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: maxTokens || 2048,
      temperature: temperature ?? 0.3,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  return {
    text,
    tokensUsed: {
      input: usage.prompt_tokens || Math.ceil(prompt.length / 4),
      output: usage.completion_tokens || Math.ceil(text.length / 4),
    },
  };
}

// ─── Claude Implementation ──────────────────────────────────────
async function callClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<{ text: string; tokensUsed: { input: number; output: number } }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens || 2048,
      temperature: temperature ?? 0.3,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || '';
  const usage = data.usage || {};

  return {
    text,
    tokensUsed: {
      input: usage.input_tokens || Math.ceil(prompt.length / 4),
      output: usage.output_tokens || Math.ceil(text.length / 4),
    },
  };
}

// ─── Model Dispatch ──────────────────────────────────────────────
async function callModel(
  model: AIModel,
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number,
  temperature?: number,
): Promise<{ text: string; tokensUsed: { input: number; output: number } }> {
  switch (model) {
    case 'gemini': return callGemini(prompt, systemPrompt, maxTokens);
    case 'openai': return callOpenAI(prompt, systemPrompt, maxTokens, temperature);
    case 'claude': return callClaude(prompt, systemPrompt, maxTokens, temperature);
    default: throw new Error(`Model ${model} does not support AI calls`);
  }
}

// ─── Cost Calculator ─────────────────────────────────────────────
function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  if (model === 'none') return 0;
  const costs = MODEL_COSTS[model];
  return (inputTokens / 1_000_000) * costs.inputPer1M +
         (outputTokens / 1_000_000) * costs.outputPer1M;
}

// ─── THE ROUTER ──────────────────────────────────────────────────

export async function routeToModel(request: ModelRequest): Promise<ModelResponse> {
  const startTime = Date.now();

  // Determine which model to use
  const route = ROUTE_TABLE[request.task];
  const targetModel = request.forceModel || route.primary;

  let result: { text: string; tokensUsed: { input: number; output: number } };
  let usedModel = targetModel;
  let fromFallback = false;

  try {
    result = await callModel(
      targetModel,
      request.prompt,
      request.systemPrompt,
      request.maxTokens,
      request.temperature,
    );
  } catch (primaryError) {
    // Fallback to secondary model
    console.warn(
      `[ModelRouter] Agent ${request.agentId} | ${targetModel} failed for ${request.task}, falling back to ${route.fallback}:`,
      primaryError,
    );

    if (request.forceModel) {
      // If model was forced, don't fallback — throw
      throw primaryError;
    }

    try {
      result = await callModel(
        route.fallback,
        request.prompt,
        request.systemPrompt,
        request.maxTokens,
        request.temperature,
      );
      usedModel = route.fallback;
      fromFallback = true;
    } catch (fallbackError) {
      throw new Error(
        `[ModelRouter] Both ${targetModel} and ${route.fallback} failed for task=${request.task}: ` +
        `Primary: ${primaryError}, Fallback: ${fallbackError}`
      );
    }
  }

  const latencyMs = Date.now() - startTime;
  const costUSD = calculateCost(
    usedModel,
    result.tokensUsed.input,
    result.tokensUsed.output,
  );

  const response: ModelResponse = {
    text: result.text,
    model: usedModel,
    tokensUsed: {
      input: result.tokensUsed.input,
      output: result.tokensUsed.output,
      total: result.tokensUsed.input + result.tokensUsed.output,
    },
    costUSD: Math.round(costUSD * 1_000_000) / 1_000_000, // 6 decimal precision
    latencyMs,
    fromFallback,
  };

  // Log for cost tracking (non-blocking)
  logModelUsage(request, response).catch(() => {});

  return response;
}

// ─── Usage Logger ────────────────────────────────────────────────
async function logModelUsage(request: ModelRequest, response: ModelResponse): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await fetch(`${siteUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'agent.model.usage',
        payload: {
          agentId: request.agentId,
          runId: request.runId,
          task: request.task,
          model: response.model,
          tokensUsed: response.tokensUsed.total,
          costUSD: response.costUSD,
          latencyMs: response.latencyMs,
          fromFallback: response.fromFallback,
        },
        ts: Date.now(),
      }),
    });
  } catch {
    // Non-blocking — never fail the agent because logging failed
  }
}

// ─── Convenience: Parse JSON from AI response ────────────────────
export function parseJSON<T = Record<string, unknown>>(text: string): T | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]) as T;
    return null;
  } catch {
    return null;
  }
}

// ─── Convenience: Route by task category ─────────────────────────
export function getModelForTask(task: TaskCategory): AIModel {
  return ROUTE_TABLE[task].primary;
}

export function getModelCosts(model: AIModel): { inputPer1M: number; outputPer1M: number } | null {
  if (model === 'none') return null;
  return MODEL_COSTS[model];
}
