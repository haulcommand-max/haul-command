// lib/ai/service.ts — HAUL COMMAND AI Service Layer

/**
 * HAUL COMMAND AI SERVICE LAYER
 * Unified interface for all ChatGPT-powered features.
 * Reads config from hc_ai_config table. Activates when OPENAI_API_KEY is set.
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

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = 'https://api.openai.com/v1/chat/completions';

export async function queryAI(req: AIRequest): Promise<AIResponse> {
    if (!API_KEY) {
        return { content: '', model: 'none', error: 'OPENAI_API_KEY not configured' };
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

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: config.system_prompt || 'You are a helpful assistant.' },
    ];

    if (req.context) {
        messages.push({ role: 'system', content: `Context:\n${req.context}` });
    }

    messages.push({ role: 'user', content: req.userMessage });

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: config.model || 'gpt-4o',
                messages,
                max_tokens: req.maxTokens || config.max_tokens || 4096,
                temperature: config.temperature || 0.7,
                ...(req.jsonMode && { response_format: { type: 'json_object' } }),
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return { content: '', model: config.model, error: `OpenAI error ${response.status}: ${err}` };
        }

        const data = await response.json();
        return {
            content: data.choices?.[0]?.message?.content || '',
            model: data.model,
            usage: data.usage,
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
