/**
 * lib/workflows/aiAnswerBuilder.ts
 * Haul Command — AI Answer Builder (Priority #10)
 *
 * Detects high-value question families without an owner surface
 * and generates answer-first pages designed to win AI citations.
 *
 * Also used by: listing rescue, regulation capture (answer block generation)
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnswerPage {
  question: string;
  jurisdiction?: string;
  direct_answer: string;
  supporting_content: string;
  faqs: { question: string; answer: string }[];
  next_action_modules: { label: string; url: string; type: string }[];
  citation_score: number;
  source_count: number;
  confidence: 'high' | 'medium' | 'low';
}

const HIGH_VALUE_QUESTIONS = [
  { q: 'What is a pilot car?', jurisdiction: 'global', topic: 'definition' },
  { q: 'When do you need a pilot car?', jurisdiction: 'US', topic: 'escort_requirements' },
  { q: 'How much do pilot cars cost?', jurisdiction: 'US', topic: 'rates' },
  { q: 'What is an oversize load?', jurisdiction: 'global', topic: 'definition' },
  { q: 'How many pilot cars do you need for a wide load?', jurisdiction: 'US', topic: 'escort_requirements' },
  { q: 'Do wind turbine blades need escort vehicles?', jurisdiction: 'US', topic: 'escort_requirements' },
  { q: 'What is a superload?', jurisdiction: 'global', topic: 'definition' },
  { q: 'Can you move oversize loads at night?', jurisdiction: 'US', topic: 'route_rules' },
  { q: 'What equipment does a pilot car need?', jurisdiction: 'US', topic: 'credential_requirements' },
  { q: 'How do I become a pilot car operator?', jurisdiction: 'US', topic: 'credential_requirements' },
  { q: 'What is an escort vehicle?', jurisdiction: 'global', topic: 'definition' },
  { q: 'What are the pilot car rules in Texas?', jurisdiction: 'US-TX', topic: 'escort_requirements' },
  { q: 'What are the pilot car rules in California?', jurisdiction: 'US-CA', topic: 'escort_requirements' },
  { q: 'What are the oversize load rules in Canada?', jurisdiction: 'CA', topic: 'escort_requirements' },
  { q: 'What are the oversize load rules in Queensland?', jurisdiction: 'AU-QLD', topic: 'escort_requirements' },
];

async function generateAnswer(
  question: string,
  jurisdiction: string,
): Promise<Omit<AnswerPage, 'citation_score' | 'source_count' | 'confidence'>> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a heavy-haul logistics expert writing answer-first content for HaulCommand.com.
Write a complete answer to this question:

QUESTION: "${question}"
JURISDICTION: ${jurisdiction}

Rules:
1. DIRECT_ANSWER: 1–2 sentences that directly answer the question — make it quotable
2. SUPPORTING_CONTENT: 2–3 paragraphs of useful context, with specific numbers/rules
3. Generate 5 follow-up FAQs with 2–3 sentence answers
4. Generate 3 next action modules (URL slugs on haulcommand.com)
5. Never make up regulations — if unsure, say "verify with [jurisdiction] DOT"
6. Write for operators and brokers, not lawyers — plain language

Return JSON:
{
  "direct_answer": "...",
  "supporting_content": "...",
  "faqs": [{"question": "...", "answer": "..."}, ...],
  "next_action_modules": [{"label": "...", "url": "...", "type": "directory|tool|regulation|training"}]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(text);
    return {
      question,
      jurisdiction,
      ...parsed,
    };
  } catch {
    return {
      question,
      jurisdiction,
      direct_answer: `${jurisdiction} has specific requirements for this. Contact Haul Command or the state DOT for current rules.`,
      supporting_content: 'Detailed information is being compiled. Check back shortly.',
      faqs: [],
      next_action_modules: [
        { label: 'Browse the directory', url: '/directory', type: 'directory' },
        { label: 'Read state regulations', url: '/regulations', type: 'regulation' },
      ],
    };
  }
}

export async function runAiAnswerBuilder(options: {
  questions?: typeof HIGH_VALUE_QUESTIONS;
  forceRebuild?: boolean;
  maxPages?: number;
}): Promise<{ built: number; skipped: number; pages: AnswerPage[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: run } = await supabase
    .from('hc_workflow_runs')
    .insert({
      workflow_key: 'ai_answer_builder',
      trigger_type: 'cron',
      status: 'running',
    })
    .select('id')
    .single();

  const questions = options.questions ?? HIGH_VALUE_QUESTIONS;
  const maxPages = options.maxPages ?? 5;
  const built: AnswerPage[] = [];
  let skipped = 0;

  for (const q of questions.slice(0, maxPages)) {
    // Check if we already have a fresh answer
    if (!options.forceRebuild) {
      const { data: existing } = await supabase
        .from('hc_ai_answers')
        .select('id, updated_at')
        .eq('question_hash', Buffer.from(q.q).toString('base64').substring(0, 32))
        .single();

      if (existing?.updated_at) {
        const ageDays = (Date.now() - new Date(existing.updated_at).getTime()) / 86_400_000;
        if (ageDays < 30) { skipped++; continue; }
      }
    }

    const content = await generateAnswer(q.q, q.jurisdiction);

    // Simple citation score for AI-generated content
    const citation_score = Math.round(
      (content.faqs.length > 3 ? 70 : 50) * 0.35 +
      (content.direct_answer.length > 80 ? 80 : 50) * 0.20 +
      60 * 0.20 +  // freshness (just built)
      (q.jurisdiction !== 'global' ? 85 : 55) * 0.15 +
      (content.next_action_modules.length > 0 ? 80 : 40) * 0.10
    );

    const page: AnswerPage = {
      ...content,
      citation_score,
      source_count: 0, // Updated when regulation pages supply sources
      confidence: citation_score >= 70 ? 'high' : citation_score >= 50 ? 'medium' : 'low',
    };

    // Upsert to hc_ai_answers
    await supabase.from('hc_ai_answers').upsert({
      question: q.q,
      question_hash: Buffer.from(q.q).toString('base64').substring(0, 32),
      jurisdiction: q.jurisdiction,
      topic: q.topic,
      direct_answer: page.direct_answer,
      supporting_content: page.supporting_content,
      faqs_json: page.faqs,
      next_action_modules_json: page.next_action_modules,
      citation_score,
      confidence: page.confidence,
    }, { onConflict: 'question_hash' });

    // Update citation score
    await supabase.from('hc_citation_scores').upsert({
      source_type: 'ai_answer',
      source_key: q.q.substring(0, 80),
      citation_score,
      freshness_score: 85,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'source_type,source_key' });

    built.push(page);
  }

  if (run?.id) {
    await supabase.from('hc_workflow_runs')
      .update({ status: 'completed', output_json: { built: built.length, skipped }, completed_at: new Date().toISOString() })
      .eq('id', run.id);
  }

  return { built: built.length, skipped, pages: built };
}

// Export question list for external use
export { HIGH_VALUE_QUESTIONS };
