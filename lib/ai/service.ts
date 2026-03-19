// lib/ai/service.ts — HAUL COMMAND AI Service Layer

/**
 * HAUL COMMAND AI SERVICE LAYER
 * Unified interface for all Claude-powered features.
 * Reads config from hc_ai_config table. Activates when ANTHROPIC_API_KEY is set.
 * Migrated from OpenAI → Anthropic Claude (2026-03-19)
 */

interface AIResponse {
    content: string;
    model: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    error?: string;
}

interface AIRequest {
    agentId: string;       // matches hc_ai_config.id
    userMessage: string;
    context?: string;      // RAG context, regulation data, etc.
    jsonMode?: boolean;    // Force JSON output
    maxTokens?: number;
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = 'https://api.anthropic.com/v1/messages';

export async function queryAI(req: AIRequest): Promise<AIResponse> {
    if (!API_KEY) {
        return { content: '', model: 'none', error: 'ANTHROPIC_API_KEY not configured' };
    }

    // Fetch agent config from Supabase
    const { supabaseServer } = await import('@/lib/supabase/server');
    const supabase = supabaseServer();
    const { data: config } = await supabase
        .from('hc_ai_config')
        .select('*')
        .eq('id', req.agentId)
        .single();

    if (!config) {
        return { content: '', model: 'none', error: `Agent ${req.agentId} not found in hc_ai_config` };
    }

    if (!config.is_enabled) {
        return { content: '', model: config.model, error: `Agent ${req.agentId} is disabled. Enable in hc_ai_config.` };
    }

    // Build system prompt — Claude uses a top-level 'system' field, not in messages array
    let systemPrompt = config.system_prompt || 'You are a helpful assistant.';

    if (req.context) {
        systemPrompt += `\n\nContext:\n${req.context}`;
    }

    // For JSON mode, append instruction to system prompt (Claude doesn't have response_format)
    if (req.jsonMode) {
        systemPrompt += '\n\nIMPORTANT: Respond ONLY with valid JSON. No prose, no markdown, no explanation — just the JSON object.';
    }

    // Claude messages array — only user/assistant roles, no 'system' role
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
        { role: 'user', content: req.userMessage },
    ];

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY!,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.model || 'claude-sonnet-4-6',
                system: systemPrompt,
                messages,
                max_tokens: req.maxTokens || config.max_tokens || 4096,
                temperature: config.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return { content: '', model: config.model, error: `Claude error ${response.status}: ${err}` };
        }

        const data = await response.json();
        return {
            content: data.content?.[0]?.text || '',
            model: data.model || config.model,
            usage: data.usage ? {
                prompt_tokens: data.usage.input_tokens || 0,
                completion_tokens: data.usage.output_tokens || 0,
                total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
            } : undefined,
        };
    } catch (error) {
        return { content: '', model: config.model, error: `Network error: ${String(error)}` };
    }
}

// ─── Specialized Agent Functions ───

export async function dispatchBrain(loadDescription: string) {
    return queryAI({
        agentId: 'dispatch_brain',
        userMessage: loadDescription,
        jsonMode: true,
    });
}

export async function regulationRAG(question: string, regulationContext: string) {
    return queryAI({
        agentId: 'regulation_rag',
        userMessage: question,
        context: regulationContext,
    });
}

export async function routeSurveyGenerator(routeData: string) {
    return queryAI({
        agentId: 'route_survey',
        userMessage: `Generate a professional route survey for:\n${routeData}`,
        maxTokens: 8192,
    });
}

export async function onboardingCopilot(question: string, operatorContext: string) {
    return queryAI({
        agentId: 'onboarding_copilot',
        userMessage: question,
        context: operatorContext,
    });
}

export async function supportBot(question: string, platformContext: string) {
    return queryAI({
        agentId: 'support_bot',
        userMessage: question,
        context: platformContext,
    });
}

export async function loadEnhancer(briefDescription: string) {
    return queryAI({
        agentId: 'load_enhancer',
        userMessage: briefDescription,
        jsonMode: true,
    });
}

export async function reviewAnalyzer(reviewText: string) {
    return queryAI({
        agentId: 'review_analyzer',
        userMessage: reviewText,
        jsonMode: true,
    });
}

export async function adCopyGenerator(corridorData: string, partnerType: string) {
    return queryAI({
        agentId: 'ad_copy_gen',
        userMessage: `Generate 5 ad variants for a ${partnerType} targeting operators in:\n${corridorData}`,
        jsonMode: true,
    });
}

export async function contractGenerator(jobDetails: string) {
    return queryAI({
        agentId: 'contract_gen',
        userMessage: `Generate an escort service agreement for:\n${jobDetails}`,
    });
}

export async function invoiceGenerator(jobData: string) {
    return queryAI({
        agentId: 'invoice_gen',
        userMessage: `Generate a professional invoice for:\n${jobData}`,
    });
}

export async function contentFactory(pageType: string, location: string, stats: string) {
    return queryAI({
        agentId: 'content_factory',
        userMessage: `Generate unique SEO content for a ${pageType} page about ${location}. Relevant stats: ${stats}`,
    });
}

export async function anomalyDetector(metricsData: string) {
    return queryAI({
        agentId: 'anomaly_detector',
        userMessage: `Analyze these daily metrics and flag anomalies:\n${metricsData}`,
        jsonMode: true,
    });
}
