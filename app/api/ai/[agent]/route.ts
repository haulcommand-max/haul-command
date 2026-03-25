import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { queryAI } from '@/lib/ai/service';

/**
 * POST /api/ai/[agent]
 * Universal AI endpoint — routes to specific agent by URL param
 * 
 * Body: { message, context?, json_mode? }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ agent: string }> }
) {
    try {
        const { agent } = await params;
        const body = await req.json();
        const { message, context, json_mode } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const validAgents = [
            'dispatch_brain', 'regulation_rag', 'route_survey',
            'onboarding_copilot', 'support_bot', 'content_factory',
            'ad_copy_gen', 'review_analyzer', 'contract_gen',
            'invoice_gen', 'load_enhancer', 'anomaly_detector',
        ];

        if (!validAgents.includes(agent)) {
            return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
        }

        const result = await queryAI(
            `Agent: ${agent}\n\nContext: ${context || 'None'}\n\nMessage: ${message}`,
            { tier: 'fast', json: json_mode || false }
        );

        return NextResponse.json({
            success: true,
            content: result.text,
            model: result.model,
            usage: {
                prompt_tokens: result.input_tokens || 0,
                completion_tokens: result.output_tokens || 0,
                total_tokens: (result.input_tokens || 0) + (result.output_tokens || 0)
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
