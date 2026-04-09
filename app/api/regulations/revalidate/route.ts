import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/regulations/revalidate
 * Triggers ISR cache purge for regulation pages.
 * Body: { country?: string, region?: string, secret: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { country, region, secret } = body;

        if (secret !== process.env.REVALIDATION_SECRET) {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }

        if (country && region) {
            revalidatePath(`/regulations/${country}/${region}`);
            return NextResponse.json({ revalidated: true, path: `/regulations/${country}/${region}` });
        }

        if (country) {
            revalidatePath(`/regulations/${country}`);
            return NextResponse.json({ revalidated: true, path: `/regulations/${country}` });
        }

        revalidatePath('/regulations');
        return NextResponse.json({ revalidated: true, path: '/regulations' });
    } catch (err) {
        return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
    }
}
