// ============================================================
// Langfuse — LLM Observability, Prompt Management, Evals
// Tracks all 12 AI agents: cost, latency, quality
// ============================================================

const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY || '';
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY || '';
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

// ── Agent Registry ──
export const AI_AGENTS = [
    'dispatch_brain',
    'regulation_rag',
    'route_survey',
    'contract_builder',
    'invoice_maker',
    'profile_optimizer',
    'review_intelligence',
    'load_enhancer',
    'ad_copy_studio',
    'anomaly_detector',
    'seo_page_factory',
    'ai_support_247',
] as const;

export type AgentName = (typeof AI_AGENTS)[number];

// ── Trace Interface ──
interface TraceInput {
    agent: AgentName;
    userId?: string;
    sessionId?: string;
    input: string;
    metadata?: Record<string, unknown>;
}

interface TraceOutput {
    traceId: string;
    output: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    cost?: number;
}

// ── Server-side Langfuse client (Edge/API routes only) ──
export async function createTrace(input: TraceInput): Promise<string> {
    if (!LANGFUSE_SECRET_KEY) {
        console.warn('[Langfuse] No secret key — skipping trace');
        return `local-trace-${Date.now()}`;
    }

    const res = await fetch(`${LANGFUSE_BASE_URL}/api/public/traces`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`)}`,
        },
        body: JSON.stringify({
            name: `agent:${input.agent}`,
            userId: input.userId,
            sessionId: input.sessionId,
            input: input.input,
            metadata: {
                ...input.metadata,
                agent: input.agent,
                timestamp: new Date().toISOString(),
            },
        }),
    });

    if (!res.ok) {
        console.error('[Langfuse] Trace creation failed:', res.statusText);
        return `failed-trace-${Date.now()}`;
    }

    const data = await res.json();
    return data.id;
}

// ── Log generation result ──
export async function logGeneration(traceId: string, output: Omit<TraceOutput, 'traceId'>) {
    if (!LANGFUSE_SECRET_KEY) return;

    await fetch(`${LANGFUSE_BASE_URL}/api/public/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${btoa(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`)}`,
        },
        body: JSON.stringify({
            traceId,
            name: 'llm_generation',
            model: output.model,
            input: '',
            output: output.output.slice(0, 2000),
            usage: {
                promptTokens: output.promptTokens,
                completionTokens: output.completionTokens,
                totalTokens: output.totalTokens,
            },
            metadata: {
                latencyMs: output.latencyMs,
                cost: output.cost,
            },
        }),
    });
}

// ── Wrapper for AI calls with automatic tracing ──
export async function tracedAiCall<T>(
    agent: AgentName,
    input: string,
    executor: () => Promise<{ result: T; model: string; promptTokens: number; completionTokens: number }>,
    opts?: { userId?: string; sessionId?: string; metadata?: Record<string, unknown> }
): Promise<T> {
    const start = Date.now();
    const traceId = await createTrace({
        agent,
        input,
        userId: opts?.userId,
        sessionId: opts?.sessionId,
        metadata: opts?.metadata,
    });

    try {
        const { result, model, promptTokens, completionTokens } = await executor();
        const latencyMs = Date.now() - start;

        await logGeneration(traceId, {
            output: typeof result === 'string' ? result : JSON.stringify(result),
            model,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            latencyMs,
        });

        return result;
    } catch (error) {
        const latencyMs = Date.now() - start;
        await logGeneration(traceId, {
            output: `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`,
            model: 'unknown',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs,
        });
        throw error;
    }
}
