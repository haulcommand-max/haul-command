import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { queryAI } from '@/lib/ai/service';

const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/ai/services
 * List all available AI services (marketplace catalog)
 */
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('hc_ai_services')
        .select('*')
        .eq('is_active', true)
        .order('category');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const free = data?.filter(s => !s.is_premium) || [];
    const premium = data?.filter(s => s.is_premium) || [];

    return NextResponse.json({
        success: true,
        total: data?.length || 0,
        free: { count: free.length, services: free },
        premium: { count: premium.length, services: premium },
    });
}

/**
 * POST /api/ai/services
 * Use an AI service
 * Body: { service_id, message, context?, options? }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { service_id, message, context, options } = body;

        if (!service_id || !message) {
            return NextResponse.json({ error: 'service_id and message required' }, { status: 400 });
        }

        // Look up the service
        const { data: service } = await supabaseAdmin
            .from('hc_ai_services')
            .select('*, hc_ai_config!agent_id(*)')
            .eq('id', service_id)
            .eq('is_active', true)
            .single();

        if (!service) {
            return NextResponse.json({ error: `Service '${service_id}' not found` }, { status: 404 });
        }

        // Call the AI agent
        const result = await queryAI(
            `Agent: ${service.agent_id}\n\nContext: ${context || 'None'}\n\nMessage: ${message}`,
            { tier: 'fast', json: options?.json_mode || false, maxTokens: options?.max_tokens || undefined }
        );

        // Increment usage counter (non-blocking)
        try {
            await supabaseAdmin.rpc('increment_usage', {
                p_service_id: service_id,
            });
        } catch {
            // Non-critical
        }

        return NextResponse.json({
            success: true,
            service: { id: service.id, name: service.name, is_premium: service.is_premium },
            content: result.text,
            model: result.model,
            usage: {
                prompt_tokens: result.input_tokens || 0,
                completion_tokens: result.output_tokens || 0,
                total_tokens: (result.input_tokens || 0) + (result.output_tokens || 0)
            },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
