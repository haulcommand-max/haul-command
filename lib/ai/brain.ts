/**
 * HAUL COMMAND — UNIFIED AI GATEWAY
 * 
 * The 3-Brain system — every call goes through one entry point.
 * The router decides which brain handles it. You never call a model directly.
 * 
 * 🧠 Claude  = THINK — Reasoning, compliance, contracts, fraud, negotiation
 * 👁️ Gemini  = SEE   — Creative, visual, ads, enrichment, summaries, multimodal
 * ⚙️ OpenAI  = ACT   — Dispatch, structured JSON output, agents, extraction
 * 
 * Speed tiers:
 *   nano    → 200-400ms   (Flash Lite / Haiku / 4o-mini)
 *   fast    → 400-900ms   (Flash / Sonnet / 4o)
 *   deep    → 1-4s        (Pro / Opus / o3)
 * 
 * Cost tiers (per 1k tokens):
 *   nano    → $0.00015 – $0.0003
 *   fast    → $0.0005  – $0.003
 *   deep    → $0.010   – $0.015
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// ── Lazy client singletons (build-safe) ──────────────────────
let _claude: Anthropic | null = null;
let _gemini: GoogleGenAI | null = null;
let _openai: OpenAI | null = null;

function claude(): Anthropic {
  if (!_claude) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');
    _claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _claude;
}

function gemini(): GoogleGenAI {
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

// ── Model constants ───────────────────────────────────────────
export const MODELS = {
  claude: {
    nano:  'claude-haiku-4-5',
    fast:  'claude-sonnet-4-5',
    deep:  'claude-opus-4-5',
  },
  gemini: {
    nano:  'gemini-2.0-flash-lite',
    fast:  'gemini-2.5-flash',
    deep:  'gemini-2.5-pro',
  },
  openai: {
    nano:  'gpt-4o-mini',
    fast:  'gpt-4o',
    deep:  'o3',
  },
} as const;

// ── Cost reference ($ per 1k tokens) ─────────────────────────
export const COST_PER_1K = {
  'claude-haiku-4-5':       0.00025,
  'claude-sonnet-4-5':      0.003,
  'claude-opus-4-5':        0.015,
  'gemini-2.0-flash-lite':  0.0003,
  'gemini-2.5-flash':       0.0005,
  'gemini-2.5-pro':         0.015,
  'gpt-4o-mini':            0.00015,
  'gpt-4o':                 0.005,
  'o3':                     0.010,
} as const;

export type SpeedTier = 'nano' | 'fast' | 'deep';
export type Brain = 'claude' | 'gemini' | 'openai';

export interface AIResult {
  text: string;
  model: string;
  brain: Brain;
  input_tokens?: number;
  output_tokens?: number;
  cost_cents?: number;
  latency_ms?: number;
}

// ── Core call functions ───────────────────────────────────────

export async function think(
  prompt: string,
  opts: { tier?: SpeedTier; system?: string; maxTokens?: number; temperature?: number; json?: boolean } = {}
): Promise<AIResult> {
  const start = Date.now();
  const tier = opts.tier ?? 'fast';
  const model = MODELS.claude[tier];
  const system = opts.json
    ? (opts.system ?? '') + '\n\nIMPORTANT: Respond ONLY with valid JSON. No prose, no markdown.'
    : (opts.system ?? 'You are a senior analyst for Haul Command, the global heavy haul operating system.');

  const res = await claude().messages.create({
    model,
    max_tokens: opts.maxTokens ?? (tier === 'nano' ? 500 : tier === 'fast' ? 2000 : 4096),
    temperature: opts.temperature ?? (opts.json ? 0 : 0.3),
    system,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  const input = res.usage.input_tokens;
  const output = res.usage.output_tokens;
  const costCents = ((input + output) / 1000) * (COST_PER_1K[model as keyof typeof COST_PER_1K] ?? 0) * 100;

  return { text, model, brain: 'claude', input_tokens: input, output_tokens: output, cost_cents: costCents, latency_ms: Date.now() - start };
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
    grounding?: boolean; // Use Google Search grounding
  } = {}
): Promise<AIResult> {
  const start = Date.now();
  const tier = opts.tier ?? 'fast';
  const model = MODELS.gemini[tier];

  const systemInstruction = opts.json
    ? (opts.system ?? '') + '\n\nRespond ONLY with valid JSON. No prose, no markdown.'
    : (opts.system ?? 'You are an expert content and creative specialist for Haul Command, the global heavy haul operating system.');

  const tools: any[] = opts.grounding ? [{ googleSearch: {} }] : [];

  // Build parts array
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
    systemInstruction,
    contents: [{ role: 'user', parts }],
    config: {
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
    schema?: object; // JSON schema for structured output
  } = {}
): Promise<AIResult> {
  const start = Date.now();
  const tier = opts.tier ?? 'fast';
  const model = MODELS.openai[tier];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: opts.system ?? 'You are a precise data extraction and dispatch agent for Haul Command.' },
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
      ? { type: 'json_schema', json_schema: { name: 'response', schema: opts.schema, strict: true } }
      : { type: 'json_object' };
  }

  const res = await openai().chat.completions.create(params);
  const text = res.choices[0].message.content ?? '';
  const input = res.usage?.prompt_tokens ?? 0;
  const output = res.usage?.completion_tokens ?? 0;
  const costCents = ((input + output) / 1000) * (COST_PER_1K[model as keyof typeof COST_PER_1K] ?? 0) * 100;

  return { text, model, brain: 'openai', input_tokens: input, output_tokens: output, cost_cents: costCents, latency_ms: Date.now() - start };
}

// ── Parallel brain calls (cross-check pattern) ────────────────

/**
 * Cross-check: Claude THINKS → OpenAI VALIDATES structure
 * Use for: contracts, payments, fraud, compliance
 */
export async function thinkThenValidate(
  thinkPrompt: string,
  validatePrompt: (thinking: string) => string,
  schema: object
): Promise<{ thinking: AIResult; validated: AIResult }> {
  const thinking = await think(thinkPrompt, { tier: 'fast' });
  const validated = await act(validatePrompt(thinking.text), { json: true, schema, tier: 'nano' });
  return { thinking, validated };
}

/**
 * Parallel see+think: Gemini SEEs the creative, Claude VALIDATES quality
 * Use for: ad creative quality gate, partner content review
 */
export async function seeWithQualityCheck(
  creativePrompt: string,
  qualityCheckPrompt: (creative: string) => string
): Promise<{ creative: AIResult; approved: boolean; feedback: string }> {
  const creative = await see(creativePrompt, { tier: 'fast' });
  const [check] = await Promise.all([
    think(qualityCheckPrompt(creative.text), { tier: 'nano', json: true })
  ]);
  let approved = true;
  let feedback = '';
  try {
    const parsed = JSON.parse(check.text);
    approved = parsed.approved ?? true;
    feedback = parsed.feedback ?? '';
  } catch { /* non-JSON response defaults to approved */ }
  return { creative, approved, feedback };
}

/**
 * Parallel act+see: OpenAI EXTRACTS data, Gemini ENRICHES it
 * Use for: listing enrichment, operator profile building
 */
export async function extractThenEnrich(
  rawData: string,
  extractPrompt: string,
  enrichPrompt: (extracted: string) => string
): Promise<{ extracted: AIResult; enriched: AIResult }> {
  const extracted = await act(extractPrompt, { json: true, tier: 'nano' });
  const enriched = await see(enrichPrompt(extracted.text), { tier: 'nano' });
  return { extracted, enriched };
}

// ── High-level domain functions (replacing lib/ai/service.ts) ──

/** 🧠 THINK: Compliance and regulation analysis */
export async function analyzeCompliance(question: string, context: string) {
  return think(`${question}\n\nRegulation context:\n${context}`, {
    tier: 'fast',
    system: 'You are a DOT compliance expert specializing in oversize/overweight permits for 57 countries. Be precise, cite specific regulations.',
  });
}

/** 🧠 THINK: Contract generation */
export async function generateContract(jobDetails: string) {
  return think(`Generate a professional escort service agreement for:\n${jobDetails}`, {
    tier: 'deep',
    system: 'You are a transportation law specialist. Generate legally sound, enforceable escort service contracts.',
    maxTokens: 4000,
  });
}

/** 🧠 THINK: Fraud detection */
export async function detectFraud(profileData: string, behaviorData: string) {
  return think(`Analyze for fraud/scam indicators:\nProfile: ${profileData}\nBehavior: ${behaviorData}`, {
    tier: 'fast',
    json: true,
    system: 'You are a fraud detection specialist for marketplace platforms. Output JSON: {risk_score: 0-100, flags: string[], recommendation: "allow"|"review"|"block", reasoning: string}',
  });
}

/** 🧠 THINK: Rate negotiation advisor */
export async function adviseRate(loadDetails: string, marketData: string) {
  return think(`Advise on fair rate for:\n${loadDetails}\n\nMarket data:\n${marketData}`, {
    tier: 'fast',
    system: 'You are a heavy haul rate negotiation expert. Give specific dollar ranges with reasoning.',
  });
}

/** 🧠 THINK: Anomaly detection in platform metrics */
export async function detectAnomaly(metricsJson: string) {
  return think(`Analyze these platform metrics and flag anomalies:\n${metricsJson}`, {
    tier: 'nano',
    json: true,
    system: 'Output JSON: {anomalies: [{metric: string, value: number, expected: number, severity: "low"|"medium"|"high", action: string}]}',
  });
}

/** 👁️ SEE: Ad copy generation — 5 variants */
export async function generateAdCopy(corridorData: string, targetAudience: string) {
  return see(
    `Generate 5 high-converting ad variants targeting ${targetAudience} for the following corridor/service:\n${corridorData}\n\nFor each variant, output: {headline, body, cta, format: "linkedin"|"google"|"meta"}`,
    { tier: 'fast', json: true, system: 'You are a B2B performance ad copywriter specializing in logistics and transportation. Write copy that speaks to operations managers, not marketers.' }
  );
}

/** 👁️ SEE: SEO content generation */
export async function generateSEOContent(pageType: string, location: string, stats: string) {
  return see(
    `Write unique SEO body content (300-500 words) for a ${pageType} page for ${location}. Key stats: ${stats}. Include H2 headings, local specifics, and a CTA to haulcommand.com.`,
    { tier: 'nano', system: 'You are an SEO content specialist for heavy haul and escort transportation.' }
  );
}

/** 👁️ SEE: Operator profile enrichment from raw data */
export async function enrichOperatorProfile(rawListing: string) {
  return see(
    `You have raw operator listing data. Write a professional 2-sentence profile bio and extract a clean list of services and equipment. Output JSON: {bio: string, services: string[], equipment: string[], specializations: string[]}\n\nRaw data:\n${rawListing}`,
    { tier: 'nano', json: true }
  );
}

/** 👁️ SEE: LinkedIn post generation */
export async function generateLinkedInPost(topic: string, stats?: string) {
  return see(
    `Write a LinkedIn post about: "${topic}"${stats ? `\n\nUse these real numbers: ${stats}` : ''}\n\nRules: Max 1,300 chars. First line = hook (specific number or counterintuitive fact). Max 2 emojis. 3 hashtags. End: "Haul Command — haulcommand.com"`,
    { tier: 'fast', system: 'Write as a sharp industry insider. Not corporate. No filler phrases.' }
  );
}

/** 👁️ SEE: YouTube script */
export async function generateYouTubeScript(topic: string) {
  return see(
    `Write a YouTube video script (5-7 min spoken) about: "${topic}"\n\nFormat: Hook (0-15s), Intro (15-45s), then 3-4 stamped sections [X:XX], CTA to haulcommand.com.`,
    { tier: 'fast', system: 'Conversational, knowledgeable. Like a mentor. Not corporate.' }
  );
}

/** 👁️ SEE: Certificate / document image parsing */
export async function parseCertificateImage(base64Image: string, mimeType = 'image/jpeg') {
  return see(
    'Extract all information from this insurance certificate or operator credential. Output JSON: {company: string, policy_number: string, coverage_type: string, effective_date: string, expiry_date: string, coverage_amount_usd: number, insured_name: string, carrier: string, valid: boolean}',
    { tier: 'fast', json: true, images: [{ base64: base64Image, mimeType } ] }
  );
}

/** 👁️ SEE: Regulation page summary with live search grounding */
export async function generateRegulationSummary(jurisdiction: string, loadType: string) {
  return see(
    `Generate a current, accurate summary of oversize/overweight transport regulations for ${jurisdiction} for ${loadType} loads. Include: permit requirements, max dimensions, escort requirements, curfews, and relevant authority contacts.`,
    { tier: 'fast', grounding: true, system: 'You are a DOT regulation expert. Be specific and accurate. Cite sources.' }
  );
}

/** 👁️ SEE: Load description enrichment */
export async function enrichLoadDescription(brief: string) {
  return see(
    `A broker wrote this load description: "${brief}"\n\nExpand it into a professional load posting. Output JSON: {title: string, full_description: string, required_certifications: string[], escort_count: number, special_requirements: string[], estimated_duration_hrs: number}`,
    { tier: 'nano', json: true }
  );
}

/** ⚙️ ACT: Dispatch matching — extract structured match from load+operators */
export async function matchDispatch(loadJson: string, operatorsJson: string) {
  return act(
    `Match this load to the best available operators. Select top 3 ranked matches.\n\nLoad: ${loadJson}\n\nAvailable operators: ${operatorsJson}`,
    {
      tier: 'fast',
      json: true,
      system: 'You are a dispatch optimization engine. Score by: proximity, certification match, rating, availability.',
      schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                operator_id: { type: 'string' },
                score: { type: 'number' },
                reasoning: { type: 'string' },
                eta_minutes: { type: 'number' },
              },
              required: ['operator_id', 'score', 'reasoning'],
            },
          },
        },
        required: ['matches'],
      },
    }
  );
}

/** ⚙️ ACT: Extract structured data from unstructured load alert text */
export async function parseLoadAlert(rawText: string) {
  return act(
    `Extract load details from this alert/email/message:\n\n${rawText}`,
    {
      tier: 'nano',
      json: true,
      schema: {
        type: 'object',
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          load_type: { type: 'string' },
          width_ft: { type: 'number' },
          height_ft: { type: 'number' },
          weight_lbs: { type: 'number' },
          escorts_needed: { type: 'number' },
          start_date: { type: 'string' },
          rate_per_mile: { type: 'number' },
          contact: { type: 'string' },
        },
        required: ['origin', 'destination'],
      },
    }
  );
}

/** ⚙️ ACT: Classify operator into certification tiers */
export async function classifyOperator(profileJson: string) {
  return act(
    `Classify this operator profile into certification tiers:\n${profileJson}`,
    {
      tier: 'nano',
      json: true,
      schema: {
        type: 'object',
        properties: {
          tier: { type: 'string', enum: ['basic', 'verified', 'certified', 'av_ready', 'elite'] },
          missing_requirements: { type: 'array', items: { type: 'string' } },
          score: { type: 'number' },
        },
        required: ['tier', 'score'],
      },
    }
  );
}

/** ⚙️ ACT: Review sentiment + tag analysis */
export async function analyzeReview(reviewText: string) {
  return act(
    `Analyze this operator review:\n${reviewText}`,
    {
      tier: 'nano',
      json: true,
      schema: {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
          score: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          flagged: { type: 'boolean' },
          flag_reason: { type: 'string' },
        },
        required: ['sentiment', 'score', 'tags', 'flagged'],
      },
    }
  );
}

/** ⚙️ ACT: Route survey structured output */
export async function generateRouteSurvey(routeJson: string) {
  return act(
    `Generate a professional pilot car route survey for:\n${routeJson}`,
    { tier: 'fast', system: 'Generate structured, professional route surveys for heavy haul transport.', maxTokens: 3000 }
  );
}


// ── Batch processing helpers (parallel, cost-efficient) ───────

/**
 * Batch enrich up to 50 listings in parallel using Gemini Flash Lite
 * Cost: ~$0.0003 per listing = ~$0.015 for 50 listings
 */
export async function batchEnrichListings(listings: Array<{ id: string; rawData: string }>) {
  const CONCURRENCY = 5; // 5 parallel Gemini calls max
  const results: Array<{ id: string; result: AIResult }> = [];

  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const result = await enrichOperatorProfile(item.rawData);
        return { id: item.id, result };
      })
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value);
    }
  }

  return results;
}

/**
 * Batch generate meta descriptions for directory pages
 * Cost: ~$0.0001 per page (50 chars output)
 */
export async function batchGenerateMetaDescriptions(
  pages: Array<{ id: string; type: string; location: string; stats: string }>
) {
  const CONCURRENCY = 10;
  const results: Array<{ id: string; meta: string }> = [];

  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (page) => {
        const res = await see(
          `Write a 155-char SEO meta description for a ${page.type} page for ${page.location}. Stats: ${page.stats}. Be specific, include location and service type.`,
          { tier: 'nano', maxTokens: 80 }
        );
        return { id: page.id, meta: res.text.slice(0, 160) };
      })
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value);
    }
  }

  return results;
}
