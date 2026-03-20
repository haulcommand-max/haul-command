import { NextRequest, NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE COPILOT API — Jurisdiction-Aware Regulation Q&A
//
// Flow:
//   1. Hash question → check compliance_copilot_cache
//   2. If cached: bump view_count + return
//   3. If miss: pull state_regulations row for jurisdiction
//   4. Call Claude claude-sonnet-4-6 with regulation context injected
//   5. Store answer in cache
//   6. Return answer + sources
// ═══════════════════════════════════════════════════════════════

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

function hashQuestion(q: string): string {
    return crypto
        .createHash('sha256')
        .update(q.toLowerCase().trim())
        .digest('hex');
}

// Pull the freshest regulation row for a given state/jurisdiction
async function fetchRegulationContext(jurisdictionCode: string | null): Promise<{
    contextText: string;
    sources: { label: string; url: string }[];
}> {
    if (!jurisdictionCode) return { contextText: '', sources: [] };

    // Normalize: "US-TX" → "TX", "tx" → "TX"
    const stateCode = jurisdictionCode.split('-').pop()?.toUpperCase() ?? jurisdictionCode.toUpperCase();

    const { data } = await supabase
        .from('state_regulations')
        .select(
            'state_name, content_markdown, height_pole_threshold, lead_car_threshold, ' +
            'chase_car_threshold, escort_required_width, escort_required_height, ' +
            'night_restrictions, weekend_rules, holiday_rules, police_required_rules, ' +
            'mobile_home_rules, curfew_notes, source_url, max_width_no_permit'
        )
        .eq('state_code', stateCode)
        .single();

    // Supabase .single() returns data or null — cast to any for untyped schema
    const row = data as any;
    if (!row) return { contextText: '', sources: [] };

    const contextText = `
STATE REGULATIONS — ${row.state_name} (${stateCode})

Escort requirements:
- Width requiring escort: ${row.escort_required_width ?? 'N/A'} ft
- Height requiring escort: ${row.escort_required_height ?? 'N/A'} ft
- Height pole threshold: ${row.height_pole_threshold ?? 'N/A'} ft
- Lead car required at: ${row.lead_car_threshold ?? 'N/A'} ft wide
- Chase car required at: ${row.chase_car_threshold ?? 'N/A'} ft wide
- Max width without permit: ${row.max_width_no_permit ?? 'N/A'} ft

Time restrictions:
- Night restrictions: ${row.night_restrictions ?? 'None specified'}
- Weekend rules: ${row.weekend_rules ?? 'None specified'}
- Holiday rules: ${row.holiday_rules ?? 'None specified'}
- Curfew notes: ${row.curfew_notes ?? 'None'}

Special rules:
- Police escort required: ${row.police_required_rules ?? 'Check with state DOT'}
- Mobile home rules: ${row.mobile_home_rules ?? 'Standard oversize rules apply'}

Full regulation detail:
${row.content_markdown ?? '(See source URL for complete requirements)'}
`.trim();

    const sources = row.source_url
        ? [{ label: `${row.state_name} DOT — Official Oversize Regulations`, url: row.source_url }]
        : [];

    return { contextText, sources };
}

const SYSTEM_PROMPT = `You are the Haul Command Compliance Copilot — an expert in oversize load escort regulations across all 50 US states, Canadian provinces, and international heavy-haul jurisdictions.

Your job is to answer compliance questions from pilot car operators, oversize load brokers, and heavy-haul trucking companies with precision and authority.

Rules for your responses:
1. Always cite the jurisdiction you're addressing. If the user mentions a state, focus on that state.
2. Be specific with numbers: width thresholds, height thresholds, escort counts, time windows.
3. If regulation context is provided below, use it as your primary source. Supplement from your training data for topics not covered.
4. Always note if rules may have changed recently and recommend verifying with the state DOT.
5. Format with markdown: use **bold** for key thresholds, bullet lists for requirements, and headers for sections.
6. End every answer with a "Sources & Verification" section listing official references.
7. Do NOT give legal advice. Frame answers as regulation guidance, not legal counsel.
8. Keep answers comprehensive but scannable — operators are in the field reading on mobile.`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, jurisdiction_code } = body as {
            question: string;
            jurisdiction_code?: string;
        };

        if (!question || question.trim().length < 5) {
            return NextResponse.json({ error: 'Question too short' }, { status: 400 });
        }
        if (question.length > 1000) {
            return NextResponse.json({ error: 'Question too long (max 1000 chars)' }, { status: 400 });
        }

        const hash = hashQuestion(question + (jurisdiction_code ?? ''));

        // ── 1. Cache check
        const { data: cached } = await supabase
            .from('compliance_copilot_cache')
            .select('id, answer_markdown, sources, model_version, created_at')
            .eq('question_hash', hash)
            .single();

        if (cached) {
            // Async view bump — don't await
            supabase.rpc('increment_copilot_view', { p_id: cached.id }).then(() => {});
            return NextResponse.json({
                answer: cached.answer_markdown,
                sources: cached.sources ?? [],
                cached: true,
                model: cached.model_version,
                cached_at: cached.created_at,
            });
        }

        // ── 2. Fetch regulation context
        const { contextText, sources } = await fetchRegulationContext(jurisdiction_code ?? null);

        const userMessage = contextText
            ? `JURISDICTION CONTEXT:\n${contextText}\n\n---\n\nUSER QUESTION:\n${question}`
            : question;

        // ── 3. Call Claude
        const { text, usage } = await generateText({
            model: anthropic('claude-sonnet-4-6'),
            system: SYSTEM_PROMPT,
            prompt: userMessage,
            maxOutputTokens: 1200,
            temperature: 0.2,  // Low temp for factual accuracy
        });

        // ── 4. Store in cache
        await supabase.from('compliance_copilot_cache').insert({
            question_hash: hash,
            question: question.trim(),
            jurisdiction_code: jurisdiction_code ?? null,
            answer_markdown: text,
            sources,
            model_version: 'claude-sonnet-4-6',
            tokens_used: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
        });

        return NextResponse.json({
            answer: text,
            sources,
            cached: false,
            model: 'claude-sonnet-4-6',
        });
    } catch (err: any) {
        console.error('[compliance-copilot]', err);
        return NextResponse.json(
            { error: 'Failed to generate compliance answer. Please try again.' },
            { status: 500 }
        );
    }
}

// GET /api/copilot/compliance?q=... — for SEO-crawlable cached answers
export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q');
    const jx = req.nextUrl.searchParams.get('jx');
    if (!q) return NextResponse.json({ error: 'Missing q param' }, { status: 400 });

    const hash = hashQuestion(q + (jx ?? ''));
    const { data } = await supabase
        .from('compliance_copilot_cache')
        .select('question, answer_markdown, sources, model_version, view_count, created_at')
        .eq('question_hash', hash)
        .single();

    if (!data) return NextResponse.json({ cached: false });
    return NextResponse.json({ cached: true, ...data });
}
