import { NextResponse } from "next/server";

/**
 * Event journal API — cost-tight v1.
 * Logs events server-side. Wire to PostHog/BigQuery/Supabase table later.
 */
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body?.name) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    console.log("[event]", body.name, body.payload ?? {}, body.ts ?? null);
    return NextResponse.json({ ok: true });
}
