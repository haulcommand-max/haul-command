import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { DistributionEngine } from '@/lib/social/distribution-engine';

const supabaseAdmin = getSupabaseAdmin();
const engine = new DistributionEngine(supabaseAdmin);

/**
 * POST /api/social/distribute
 * Schedule or immediately publish a social distribution post
 *
 * Body: {
 *   content_bucket: string,
 *   channel: string,
 *   target_role: 'operator' | 'broker' | 'both',
 *   country_code: string,
 *   corridor_code?: string,
 *   headline: string,
 *   body: string,
 *   cta_text: string,
 *   cta_url: string,
 *   image_url?: string,
 *   scheduled_at?: string,  // Default: now (immediate)
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            content_bucket,
            channel,
            target_role = 'both',
            country_code,
            corridor_code,
            headline,
            cta_text,
            cta_url,
            image_url,
            scheduled_at,
        } = body;

        const postBody = body.body;

        if (!content_bucket || !channel || !country_code || !headline || !postBody || !cta_text || !cta_url) {
            return NextResponse.json(
                { error: 'Required: content_bucket, channel, country_code, headline, body, cta_text, cta_url' },
                { status: 400 },
            );
        }

        const result = await engine.schedulePost({
            content_bucket,
            channel,
            target_role,
            country_code,
            corridor_code,
            headline,
            body: postBody,
            cta_text,
            cta_url,
            image_url,
            scheduled_at: scheduled_at || new Date().toISOString(),
            metadata: { source: 'api', created_at: new Date().toISOString() },
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            post_id: result.post_id,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * GET /api/social/distribute
 * Get distribution stats or run publish batch
 *
 * Query: ?action=publish_batch | ?action=stats&country=US
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'publish_batch') {
        const result = await engine.publishDuePostsBatch();
        return NextResponse.json(result);
    }

    // Stats: recent distribution posts
    const country = searchParams.get('country');
    let query = supabaseAdmin
        .from('distribution_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (country) {
        query = query.eq('country_code', country.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        posts: data,
        count: data?.length || 0,
    });
}
