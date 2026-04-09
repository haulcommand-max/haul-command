import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/tools/revalidate
 * Triggers ISR cache purge for tool pages.
 * Body: { tool_slug?: string, country?: string, region?: string, secret: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tool_slug, country, region, secret } = body;

        if (secret !== process.env.REVALIDATION_SECRET) {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }

        if (country && region && tool_slug) {
            revalidatePath(`/tools/${country}/${region}/${tool_slug}`);
            return NextResponse.json({ revalidated: true, path: `/tools/${country}/${region}/${tool_slug}` });
        }

        revalidatePath('/tools');
        return NextResponse.json({ revalidated: true, path: '/tools' });
    } catch (err) {
        return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
    }
}
