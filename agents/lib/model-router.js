/**
 * Model Router — Automatic cheapest-model selection for Haul Command agents
 * =========================================================================
 * 
 * Cost ladder (cheapest → most expensive):
 *   no-model → nano/Lite → mini/Flash → GPT-5.4/Sonnet → Opus/Pro
 * 
 * Usage in any agent script:
 *   const { route, escalate } = require('../lib/model-router');
 * 
 *   // Auto-select cheapest model for a task
 *   const result = await route('draft_cold_email', {
 *     prompt: 'Write a cold outreach email to...',
 *     blast_radius: 'low',
 *     modality: 'text',
 *   });
 * 
 *   // Force escalation if result is bad
 *   if (result.confidence < 0.7) {
 *     const better = await escalate(result);
 *   }
 */

const fs = require('fs');
const path = require('path');

// ── Load routing policy ──────────────────────────────────────────────────────
const POLICY_PATH = path.join(__dirname, '..', 'config', 'routing-policy.json');
let POLICY;
try {
  POLICY = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
} catch (e) {
  console.error('[model-router] Failed to load routing policy:', e.message);
  process.exit(1);
}

// ── Model configurations ────────────────────────────────────────────────────
const MODELS = {
  // Claude (Anthropic)
  'claude-opus-4.6':   { provider: 'anthropic', apiModel: 'claude-opus-4-6-20260401',   tier: 5, inputCost: 5.00,  outputCost: 25.00 },
  'claude-sonnet-4.6': { provider: 'anthropic', apiModel: 'claude-sonnet-4-6-20260401', tier: 4, inputCost: 3.00,  outputCost: 15.00 },
  'claude-haiku-4.5':  { provider: 'anthropic', apiModel: 'claude-haiku-4-5-20260301',  tier: 2, inputCost: 1.00,  outputCost: 5.00  },

  // OpenAI
  'gpt-5.4':      { provider: 'openai', apiModel: 'gpt-5.4',      tier: 4, inputCost: 2.50,  outputCost: 15.00 },
  'gpt-5.4-mini': { provider: 'openai', apiModel: 'gpt-5.4-mini', tier: 2, inputCost: 0.75,  outputCost: 4.50  },
  'gpt-5.4-nano': { provider: 'openai', apiModel: 'gpt-5.4-nano', tier: 1, inputCost: 0.20,  outputCost: 1.25  },

  // Google (Gemini)
  'gemini-2.5-pro':        { provider: 'google', apiModel: 'gemini-2.5-pro',        tier: 4, inputCost: 1.25,  outputCost: 5.00  },
  'gemini-2.5-flash':      { provider: 'google', apiModel: 'gemini-2.5-flash',      tier: 2, inputCost: 0.30,  outputCost: 2.50  },
  'gemini-2.5-flash-lite': { provider: 'google', apiModel: 'gemini-2.5-flash-lite', tier: 1, inputCost: 0.10,  outputCost: 0.40  },
};

// ── Escalation chain ─────────────────────────────────────────────────────────
const ESCALATION = {
  'gpt-5.4-nano':          'gpt-5.4-mini',
  'gemini-2.5-flash-lite': 'gemini-2.5-flash',
  'gpt-5.4-mini':          'gpt-5.4',
  'gemini-2.5-flash':      'gemini-2.5-pro',
  'claude-haiku-4.5':      'claude-sonnet-4.6',
  'gpt-5.4':               'claude-sonnet-4.6',
  'gemini-2.5-pro':        'claude-opus-4.6',
  'claude-sonnet-4.6':     'claude-opus-4.6',
  'claude-opus-4.6':       null, // Top of chain
};

// ── Provider API Clients ─────────────────────────────────────────────────────

async function callAnthropic(model, prompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: options.max_tokens || 2048,
      messages: [{ role: 'user', content: prompt }],
      ...(options.system && { system: options.system }),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${model.apiModel}: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    text: data.content[0].text,
    model: model.apiModel,
    provider: 'anthropic',
    input_tokens: data.usage.input_tokens,
    output_tokens: data.usage.output_tokens,
    cost: (data.usage.input_tokens * model.inputCost / 1000000) + (data.usage.output_tokens * model.outputCost / 1000000),
  };
}

async function callOpenAI(model, prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: options.max_tokens || 2048,
      messages: [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${model.apiModel}: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    text: data.choices[0].message.content,
    model: model.apiModel,
    provider: 'openai',
    input_tokens: data.usage.prompt_tokens,
    output_tokens: data.usage.completion_tokens,
    cost: (data.usage.prompt_tokens * model.inputCost / 1000000) + (data.usage.completion_tokens * model.outputCost / 1000000),
  };
}

async function callGoogle(model, prompt, options = {}) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: options.max_tokens || 2048 },
        ...(options.system && {
          systemInstruction: { parts: [{ text: options.system }] },
        }),
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google ${model.apiModel}: ${res.status} ${err}`);
  }

  const data = await res.json();
  const usage = data.usageMetadata || {};
  return {
    text: data.candidates[0].content.parts[0].text,
    model: model.apiModel,
    provider: 'google',
    input_tokens: usage.promptTokenCount || 0,
    output_tokens: usage.candidatesTokenCount || 0,
    cost: ((usage.promptTokenCount || 0) * model.inputCost / 1000000) + ((usage.candidatesTokenCount || 0) * model.outputCost / 1000000),
  };
}

// ── Router Dispatch ──────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  google: callGoogle,
};

/**
 * Call a specific model by name.
 * @param {string} modelName - e.g. 'gpt-5.4-nano', 'gemini-2.5-flash', 'claude-opus-4.6'
 * @param {string} prompt    - The prompt text
 * @param {object} options   - { system, max_tokens }
 * @returns {Promise<{text, model, provider, input_tokens, output_tokens, cost}>}
 */
async function call(modelName, prompt, options = {}) {
  const model = MODELS[modelName];
  if (!model) throw new Error(`Unknown model: ${modelName}`);
  const fn = PROVIDERS[model.provider];
  if (!fn) throw new Error(`Unknown provider: ${model.provider}`);
  return fn(model, prompt, options);
}

/**
 * Auto-route a task to the cheapest appropriate model.
 * Looks up the task in the routing policy's agent_assignments.
 * If no mapping found, classifies by blast_radius/modality.
 * 
 * @param {string} agentKey  - e.g. 'revenue_engine', 'seo_engine'
 * @param {string} taskKey   - e.g. 'cold_email_draft', 'glossary_answer_block'
 * @param {string} prompt    - The prompt text
 * @param {object} options   - { system, max_tokens, blast_radius, modality, context_tokens }
 * @returns {Promise<{text, model, provider, cost} | null>}
 */
async function route(agentKey, taskKey, prompt, options = {}) {
  // Step 1: Check if task has explicit model assignment
  const agentConfig = POLICY.agent_assignments[agentKey];
  if (agentConfig && agentConfig.sub_tasks && agentConfig.sub_tasks[taskKey]) {
    const taskConfig = agentConfig.sub_tasks[taskKey];
    if (taskConfig.model === null) {
      // Explicitly marked as no-model — deterministic task
      return null;
    }
    return call(taskConfig.model, prompt, options);
  }

  // Step 2: Auto-classify if no explicit mapping
  const br = options.blast_radius || 'low';
  const mod = options.modality || 'text';
  const ctx = options.context_tokens || 0;

  // Giant context → Gemini Pro
  if (ctx > 200000) return call('gemini-2.5-pro', prompt, options);
  // Critical blast radius → Opus
  if (br === 'critical') return call('claude-opus-4.6', prompt, options);
  // Code tasks → OpenAI
  if (mod === 'code' && br !== 'low') return call('gpt-5.4', prompt, options);
  if (mod === 'code') return call('gpt-5.4-mini', prompt, options);
  // Medium text → Flash
  if (br === 'medium') return call('gemini-2.5-flash', prompt, options);
  // Default low-risk text → cheapest available
  return call('gpt-5.4-nano', prompt, options);
}

/**
 * Escalate to the next model in the chain.
 * @param {object} previousResult - Result from a previous call/route
 * @param {string} prompt         - Original prompt
 * @param {object} options        - Original options
 * @returns {Promise<{text, model, provider, cost} | null>}
 */
async function escalate(previousResult, prompt, options = {}) {
  // Find next model in escalation chain
  const currentModel = Object.keys(MODELS).find(k => MODELS[k].apiModel === previousResult.model);
  if (!currentModel) throw new Error(`Cannot find model for escalation: ${previousResult.model}`);

  const nextModel = ESCALATION[currentModel];
  if (!nextModel) {
    console.warn('[model-router] Already at top of escalation chain (Opus). Cannot escalate further.');
    return previousResult;
  }

  console.log(`[model-router] Escalating: ${currentModel} → ${nextModel}`);
  return call(nextModel, prompt, options);
}

/**
 * Track cumulative cost across a script run.
 */
class CostTracker {
  constructor(agentName) {
    this.agentName = agentName;
    this.calls = [];
    this.totalCost = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }

  record(result) {
    if (!result) return; // No-model tasks
    this.calls.push({
      model: result.model,
      provider: result.provider,
      cost: result.cost,
      input_tokens: result.input_tokens,
      output_tokens: result.output_tokens,
      timestamp: new Date().toISOString(),
    });
    this.totalCost += result.cost;
    this.totalInputTokens += result.input_tokens;
    this.totalOutputTokens += result.output_tokens;
  }

  summary() {
    return {
      agent: this.agentName,
      total_calls: this.calls.length,
      total_cost: `$${this.totalCost.toFixed(4)}`,
      total_input_tokens: this.totalInputTokens,
      total_output_tokens: this.totalOutputTokens,
      by_provider: this.calls.reduce((acc, c) => {
        acc[c.provider] = (acc[c.provider] || 0) + 1;
        return acc;
      }, {}),
      by_model: this.calls.reduce((acc, c) => {
        acc[c.model] = (acc[c.model] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  print() {
    const s = this.summary();
    console.log(`\n  [${s.agent}] Cost Report:`);
    console.log(`    Calls: ${s.total_calls}  |  Cost: ${s.total_cost}`);
    console.log(`    Tokens: ${s.total_input_tokens} in / ${s.total_output_tokens} out`);
    console.log(`    Models used:`, s.by_model);
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = { call, route, escalate, CostTracker, MODELS, ESCALATION, POLICY };
