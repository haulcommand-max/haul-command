import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

/**
 * HAUL COMMAND — UNIFIED AI GATEWAY
 *
 * Active providers:
 * - OpenAI = THINK + ACT: reasoning, compliance, contracts, fraud, structured output, agents, extraction
 * - Gemini = SEE: creative, visual, ads, enrichment, summaries, multimodal, grounding
 */

let _gemini: GoogleGenAI | null = null;
let _openai: OpenAI | null = null;

export function gemini(): GoogleGenAI {
  if (!_gemini) {
    if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _gemini;
}

function openai(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const MODELS = {
  gemini: {
    nano: 'gemini-2.0-flash-lite',
    fast: 'gemini-2.5-flash',
    deep: 'gemini-2.5-pro',
  },
  openai: {
    nano: 'gpt-4o-mini',
    fast: 'gpt-4o',
    deep: 'o3',
  },
} as const;

export const COST_PER_1K = {
  'gemini-2.0-flash-lite': 0.0003,
  'gemini-2.5-flash': 0.0005,
  'gemini-2.5-pro': 0.015,
  'gpt-4o-mini': 0.00015,
  'gpt-4o': 0.005,
  'o3': 0.010,
} as const;

export type SpeedTier = 'nano' | 'fast' | 'deep';
export type Brain = 'gemini' | 'openai';

export interface AIResult {
  text: string;
  model: string;
  brain: Brain;
  input_tokens?: number;
  output_tokens?: number;
  cost_cents?: number;
  latency_ms?: number;
}

export async function think(
  prompt: string,
  opts: { tier?: SpeedTier; system?: string; maxTokens?: number; temperature?: number; json?: boolean; schema?: object } = {}
): Promise<AIResult> {
  const system = opts.system ?? 'You are a senior analyst for Haul Command, the global heavy haul operating system.';
  return act(prompt, { ...opts, system });
}

export async function see(
  prompt: string,
  opts: {
    tier?: SpeedTier;
    system?: string;
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
    images?: Array<{ url?: string; base64?: string; mimeType?: string }>;
    grounding?: boolean;
  } = {}
): Promise<AIResult> {
  const start = Date.now();
  const tier = opts.tier ?? 'fast';
  const model = MODELS.gemini[tier];

  const systemInstruction = opts.json
    ? (opts.system ?? '') + '\n\nRespond ONLY with valid JSON. No prose, no markdown.'
    : (opts.system ?? 'You are an expert content and creative specialist for Haul Command, the global heavy haul operating system.');

  const tools: any[] = opts.grounding ? [{ googleSearch: {} }] : [];

  const parts: any[] = [];
  if (opts.images) {
    for (const img of opts.images) {
      if (img.url) {
        parts.push({ fileData: { fileUri: img.url, mimeType: img.mimeType ?? 'image/jpeg' } });
      } else if (img.base64) {
        parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType ?? 'image/jpeg' } });
      }
    }
  }
  parts.push({ text: prompt });

  const res = await gemini().models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      maxOutputTokens: opts.maxTokens ?? (tier === 'nano' ? 500 : tier === 'fast' ? 2000 : 8192),
      temperature: opts.temperature ?? (opts.json ? 0 : 0.7),
      tools: tools.length ? tools : undefined,
    },
  });

  const text = res.text ?? '';
  const input = res.usageMetadata?.promptTokenCount ?? 0;
  const output = res.usageMetadata?.candidatesTokenCount ?? 0;
  const costCents = ((input + output) / 1000) * (COST_PER_1K[model as keyof typeof COST_PER_1K] ?? 0) * 100;

  return { text, model, brain: 'gemini', input_tokens: input, output_tokens: output, cost_cents: costCents, latency_ms: Date.now() - start };
}

export async function act(
  prompt: string,
  opts: {
    tier?: SpeedTier;
    system?: string;
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
    schema?: object;
  } = {}
): Promise<AIResult> {
  const start = Date.now();
  const tier = opts.tier ?? 'fast';
  const model = MODELS.openai[tier];

  const systemContent = opts.json
    ? (opts.system ?? 'You are a precise data extraction and dispatch agent for Haul Command.') + '\n\nRespond ONLY with valid JSON. No prose, no markdown.'
    : (opts.system ?? 'You are a precise data extraction and dispatch agent for Haul Command.');

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: prompt },
  ];

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    max_tokens: opts.maxTokens ?? (tier === 'nano' ? 500 : 2000),
    temperature: opts.temperature ?? (opts.json ? 0 : 0.2),
    messages,
  };

  if (opts.json || opts.schema) {
    params.response_format = opts.schema
      ? { type: 'json_schema', json_schema: { name: 'response', schema: opts.schema as Record<string, any>, strict: true } }
      : { type: 'json_object' };
  }

  const res = await openai().chat.completions.create(params);
  const text = res.choices[0].message.content ?? '';
  const input = res.usage?.prompt_tokens ?? 0;
  const output = res.usage?.completion_tokens ?? 0;
  const costCents = ((input + output) / 1000) * (COST_PER_1K[model as keyof typeof COST_PER_1K] ?? 0) * 100;

  return { text, model, brain: 'openai', input_tokens: input, output_tokens: output, cost_cents: costCents, latency_ms: Date.now() - start };
}

export async function thinkThenValidate(
  thinkPrompt: string,
  validatePrompt: (thinking: string) => string,
  schema: object
): Promise<{ thinking: AIResult; validated: AIResult }> {
  const thinking = await think(thinkPrompt, { tier: 'fast' });
  const validated = await act(validatePrompt(thinking.text), { json: true, schema, tier: 'nano' });
  return { thinking, validated };
}

export async function seeWithQualityCheck(
  creativePrompt: string,
  qualityCheckPrompt: (creative: string) => string
): Promise<{ creative: AIResult; approved: boolean; feedback: string }> {
  const creative = await see(creativePrompt, { tier: 'fast' });
  const check = await think(qualityCheckPrompt(creative.text), { tier: 'nano', json: true });
  let approved = true;
  let feedback = '';
  try {
    const parsed = JSON.parse(check.text);
    approved = parsed.approved ?? true;
    feedback = parsed.feedback ?? '';
  } catch { /* non-JSON response defaults to approved */ }
  return { creative, approved, feedback };
}

export async function extractThenEnrich(
  rawData: string,
  extractPrompt: string,
  enrichPrompt: (extracted: string) => string
): Promise<{ extracted: AIResult; enriched: AIResult }> {
  const extracted = await act(extractPrompt, { json: true, tier: 'nano' });
  const enriched = await see(enrichPrompt(extracted.text), { tier: 'nano' });
  return { extracted, enriched };
}

export async function analyzeCompliance(question: string, context: string) {
  return think(`${question}\n\nRegulation context:\n${context}`, {
    tier: 'fast',
    system: 'You are a DOT compliance expert specializing in oversize/overweight permits for 120 countries. Be precise, cite specific regulations.',
  });
}

export async function generateContract(jobDetails: string) {
  return think(`Generate a professional escort service agreement for:\n${jobDetails}`, {
    tier: 'deep',
    system: 'You are a transportation law specialist. Generate legally sound, enforceable escort service contracts.',
    maxTokens: 4000,
  });
}

export async function detectFraud(profileData: string, behaviorData: string) {
  return think(`Analyze for fraud/scam indicators:\nProfile: ${profileData}\nBehavior: ${behaviorData}`, {
    tier: 'fast',
    json: true,
    system: 'You are a fraud detection specialist for marketplace platforms. Output JSON: {risk_score: 0-100, flags: string[], recommendation: "allow"|"review"|"block", reasoning: string}',
  });
}

export async function adviseRate(loadDetails: string, marketData: string) {
  return think(`Advise on fair rate for:\n${loadDetails}\n\nMarket data:\n${marketData}`, {
    tier: 'fast',
    system: 'You are a heavy haul rate negotiation expert. Give specific dollar ranges with reasoning.',
  });
}

export async function detectAnomaly(metricsJson: string) {
  return think(`Analyze these platform metrics and flag anomalies:\n${metricsJson}`, {
    tier: 'nano',
    json: true,
    system: 'Output JSON: {anomalies: [{metric: string, value: number, expected: number, severity: "low"|"medium"|"high", action: string}]}',
  });
}

export async function generateAdCopy(corridorData: string, targetAudience: string) {
  return see(
    `Generate 5 high-converting ad variants targeting ${targetAudience} for the following corridor/service:\n${corridorData}\n\nFor each variant, output: {headline, body, cta, format: "linkedin"|"google"|"meta"}`,
    { tier: 'fast', json: true, system: 'You are a B2B performance ad copywriter specializing in logistics and transportation. Write copy that speaks to operations managers, not marketers.' }
  );
}

export async function generateSEOContent(pageType: string, location: string, stats: string) {
  return see(
    `Write unique SEO body content (300-500 words) for a ${pageType} page for ${location}. Key stats: ${stats}. Include H2 headings, local specifics, and a CTA to haulcommand.com.`,
    { tier: 'nano', system: 'You are an SEO content specialist for heavy haul and escort transportation.' }
  );
}

export async function enrichOperatorProfile(rawListing: string) {
  return see(
    `You have raw operator listing data. Write a professional 2-sentence profile bio and extract a clean list of services and equipment. Output JSON: {bio: string, services: string[], equipment: string[], specializations: string[]}\n\nRaw data:\n${rawListing}`,
    { tier: 'nano', json: true }
  );
}

export async function generateLinkedInPost(topic: string, stats?: string) {
  return see(
    `Write a LinkedIn post about: "${topic}"${stats ? `\n\nUse these real numbers: ${stats}` : ''}\n\nRules: Max 1,300 chars. First line = hook (specific number or counterintuitive fact). Max 2 emojis. 3 hashtags. End: "Haul Command — haulcommand.com"`,
    { tier: 'fast', system: 'Write as a sharp industry insider. Not corporate. No filler phrases.' }
  );
}

export async function generateYouTubeScript(topic: string) {
  return see(
    `Write a YouTube video script (5-7 min spoken) about: "${topic}"\n\nFormat: Hook (0-15s), Intro (15-45s), then 3-4 stamped sections [X:XX], CTA to haulcommand.com.`,
    { tier: 'fast', system: 'Conversational, knowledgeable. Like a mentor. Not corporate.' }
  );
}
