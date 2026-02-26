import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Lightweight health check for smoke tests, load balancers, and CI.
 * Returns platform status + key entity counts.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
    const now = new Date().toISOString();

    // Basic health — if this endpoint responds, the app is alive
    const health = {
        status: 'ok',
        timestamp: now,
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
        region: process.env.VERCEL_REGION ?? 'local',
    };

    return NextResponse.json(health, {
        status: 200,
        headers: {
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
