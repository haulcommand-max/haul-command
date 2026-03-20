/**
 * scripts/seed-copilot-cache.ts
 * 
 * Pre-seeds the compliance_copilot_cache with 200 common questions
 * (50 states × 4 question templates).
 * 
 * Creates SEO-indexable pages ranking for "[state] pilot car requirements".
 * 
 * Run: npx tsx scripts/seed-copilot-cache.ts
 * 
 * Requires: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Config ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── US States ─────────────────────────────────────────────────────
const STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

// ── 4 Question Templates ──────────────────────────────────────────
const TEMPLATES = [
  (state: string) => `Do I need an escort in ${state}?`,
  (state: string) => `What is the max width without a permit in ${state}?`,
  (state: string) => `Do I need a height pole in ${state}?`,
  (state: string) => `Are there night travel restrictions in ${state}?`,
];

function hashQuestion(q: string): string {
  return crypto.createHash('sha256').update(q.toLowerCase().trim()).digest('hex');
}

// ── Call Claude ────────────────────────────────────────────────────
async function callClaude(question: string, stateCode: string, stateName: string): Promise<string> {
  const systemPrompt = `You are the Haul Command Compliance Copilot — an expert in oversize load escort regulations across all 50 US states.

Answer the following compliance question for ${stateName} (${stateCode}). Be specific with:
- Width/height/length thresholds
- Number of escort vehicles required at each threshold  
- Lead car vs chase car requirements
- Height pole requirements and thresholds
- Night/weekend/holiday restrictions
- Police escort triggers
- Permit requirements

Format with markdown. Use **bold** for key thresholds. End with a "Sources & Verification" section recommending the official state DOT website.

Important: This answer will be cached as an SEO page. Be comprehensive but scannable.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Main Seed Logic ───────────────────────────────────────────────
async function main() {
  console.log('🚀 Compliance Copilot Cache Seeder');
  console.log(`   ${STATES.length} states × ${TEMPLATES.length} templates = ${STATES.length * TEMPLATES.length} questions\n`);

  let seeded = 0;
  let cached = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [stateCode, stateName] of STATES) {
    for (let tIdx = 0; tIdx < TEMPLATES.length; tIdx++) {
      const question = TEMPLATES[tIdx](stateName);
      const jurisdictionCode = `US-${stateCode}`;
      const hash = hashQuestion(question + jurisdictionCode);

      // Check if already cached
      const { data: existing } = await supabase
        .from('compliance_copilot_cache')
        .select('id')
        .eq('question_hash', hash)
        .single();

      if (existing) {
        cached++;
        process.stdout.write(`  ⏭ ${stateCode} Q${tIdx + 1} (cached)\r`);
        continue;
      }

      // Call Claude
      try {
        const answer = await callClaude(question, stateCode, stateName);

        if (!answer) {
          failed++;
          errors.push(`${stateCode} Q${tIdx + 1}: Empty response`);
          continue;
        }

        // Store in cache
        const { error: insertError } = await supabase
          .from('compliance_copilot_cache')
          .insert({
            question_hash: hash,
            question: question.trim(),
            jurisdiction_code: jurisdictionCode,
            answer_markdown: answer,
            sources: [{
              label: `${stateName} DOT — Official Oversize/Overweight Regulations`,
              url: `https://www.google.com/search?q=${encodeURIComponent(`${stateName} DOT oversize load escort requirements`)}`,
            }],
            model_version: 'claude-3-5-sonnet-20241022',
            tokens_used: 0, // We don't get exact usage from raw API
          });

        if (insertError) {
          failed++;
          errors.push(`${stateCode} Q${tIdx + 1}: DB insert error: ${insertError.message}`);
        } else {
          seeded++;
          console.log(`  ✅ ${stateCode} Q${tIdx + 1}: "${question.slice(0, 50)}..."`);
        }

        // Rate limit: ~2 req/sec to stay within Claude limits
        await new Promise(r => setTimeout(r, 600));

      } catch (err: any) {
        failed++;
        errors.push(`${stateCode} Q${tIdx + 1}: ${err.message?.slice(0, 80)}`);
        console.error(`  ❌ ${stateCode} Q${tIdx + 1}: ${err.message?.slice(0, 80)}`);

        // Back off on rate limit errors
        if (err.message?.includes('429') || err.message?.includes('rate')) {
          console.log('  ⏳ Rate limited — waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
        }
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('═'.repeat(50));
  console.log(`  ✅ Seeded:          ${seeded}`);
  console.log(`  ⏭ Already cached:  ${cached}`);
  console.log(`  ❌ Failed:          ${failed}`);
  console.log(`  📄 Total processed: ${seeded + cached + failed}`);
  console.log('═'.repeat(50));

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\n🔗 These are now accessible via:`);
  console.log(`   GET /api/copilot/compliance?q=Do+I+need+an+escort+in+Texas?&jx=US-TX`);
  console.log(`   GET /tools/compliance-copilot (interactive UI)`);
}

main().catch(console.error);
