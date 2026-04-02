import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'haul-command',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        agents: 12,
        countries: 57,
    });
}
