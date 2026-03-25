import { NextRequest, NextResponse } from 'next/server';
import { batchIngestYaml } from '@/lib/ingestion/engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // allow 5 mins for batch LLM extraction

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const yamlPayload = body.yaml;

        if (!yamlPayload) {
            return NextResponse.json({ error: 'Missing "yaml" root field in payload' }, { status: 400 });
        }

        const result = await batchIngestYaml(yamlPayload);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unknown processing error' }, { status: 500 });
    }
}
