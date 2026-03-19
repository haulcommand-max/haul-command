// AI Reporter — Powered by Anthropic Claude
// Generates market intelligence reports from Supabase data

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 60;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

interface ReportRequest {
    report_type: 'corridor_health' | 'market_snapshot' | 'supply_gap' | 'revenue_summary' | 'custom';
    country_code?: string;
    corridor_code?: string;
    custom_prompt?: string;
}

export async function POST(req: Request) {
    if (!ANTHROPIC_API_KEY) {
        return NextResponse.json(
            { error: 'ANTHROPIC_API_KEY not configured' },
            { status: 500 }
        );
    }

    try {
        const body: ReportRequest = await req.json();
        const { report_type, country_code, corridor_code, custom_prompt } = body;

        if (!report_type) {
            return NextResponse.json({ error: 'report_type is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Gather context data based on report type
        let dataContext = '';

        if (report_type === 'corridor_health' || report_type === 'market_snapshot') {
            const { data: corridors } = await supabaseAdmin
                .from('corridors')
                .select('name, origin_state, dest_state, distance_miles, load_count_30d, avg_rate, liquidity_score')
                .order('load_count_30d', { ascending: false })
                .limit(20);
            if (corridors?.length) {
                dataContext += `Top Corridors:\n${JSON.stringify(corridors, null, 2)}\n\n`;
            }
        }

        if (report_type === 'supply_gap' || report_type === 'market_snapshot') {
            const { data: supply } = await supabaseAdmin
                .from('profiles')
                .select('state, role, availability_status')
                .eq('role', 'operator')
                .limit(100);
            if (supply?.length) {
                const byState: Record<string, { total: number; available: number }> = {};
                for (const op of supply) {
                    const st = op.state || 'unknown';
                    if (!byState[st]) byState[st] = { total: 0, available: 0 };
                    byState[st].total++;
                    if (op.availability_status === 'available') byState[st].available++;
                }
                dataContext += `Operator Supply by State:\n${JSON.stringify(byState, null, 2)}\n\n`;
            }
        }

        if (report_type === 'revenue_summary') {
            const { data: subs } = await supabaseAdmin
                .from('subscriptions')
                .select('plan, status, created_at')
                .eq('status', 'active')
                .limit(200);
            if (subs?.length) {
                dataContext += `Active Subscriptions: ${subs.length}\n`;
                const planCounts: Record<string, number> = {};
                for (const s of subs) {
                    planCounts[s.plan] = (planCounts[s.plan] || 0) + 1;
                }
                dataContext += `By Plan: ${JSON.stringify(planCounts)}\n\n`;
            }
        }

        // Build the system prompt based on report type
        const systemPrompts: Record<string, string> = {
            corridor_health: `You are the Haul Command Market Intelligence Reporter. Analyze the corridor data provided and generate a detailed health report. Include: busiest corridors, rate trends, liquidity concerns, and actionable recommendations for operators. Format as a structured report with sections.`,
            market_snapshot: `You are the Haul Command Market Intelligence Reporter. Generate a comprehensive market snapshot covering supply/demand balance, corridor activity, operator availability, and market trends. Include specific numbers from the data provided. Format as an executive brief.`,
            supply_gap: `You are the Haul Command Supply Intelligence Agent. Analyze operator supply data and identify gap zones — states or corridors with insufficient operator coverage. Recommend repositioning strategies and highlight urgent shortage areas.`,
            revenue_summary: `You are the Haul Command Revenue Analyst. Analyze subscription and payment data to produce a revenue summary. Include MRR estimates, plan distribution, growth indicators, and revenue optimization recommendations.`,
            custom: `You are the Haul Command AI Reporter. Provide a thorough, data-backed analysis based on the data and prompt provided. Be specific, cite numbers, and include actionable recommendations.`,
        };

        const systemPrompt = systemPrompts[report_type] || systemPrompts.custom;
        const userMessage = custom_prompt
            ? `${custom_prompt}\n\nData:\n${dataContext}`
            : `Generate a ${report_type.replace(/_/g, ' ')} report.${country_code ? ` Focus on country: ${country_code}.` : ''}${corridor_code ? ` Focus on corridor: ${corridor_code}.` : ''}\n\nData:\n${dataContext}`;

        const response = await fetch(ANTHROPIC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }],
                max_tokens: 8192,
                temperature: 0.4,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return NextResponse.json(
                { error: `Claude error ${response.status}: ${errText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const reportContent = data.content?.[0]?.text || '';

        return NextResponse.json({
            success: true,
            report_type,
            model: data.model || 'claude-sonnet-4-6',
            content: reportContent,
            usage: data.usage ? {
                input_tokens: data.usage.input_tokens,
                output_tokens: data.usage.output_tokens,
            } : undefined,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
