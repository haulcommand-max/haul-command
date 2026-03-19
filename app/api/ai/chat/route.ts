import { NextRequest } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const input = body?.input ?? "";

    if (typeof input !== "string" || input.length < 1) {
        return Response.json({ error: "Missing input" }, { status: 400 });
    }
    if (input.length > 8000) {
        return Response.json({ error: "Input too large" }, { status: 413 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: "Server missing ANTHROPIC_API_KEY" }, { status: 500 });

    // Rate limiting placeholder - in prod use KV or DB
    // console.log(`[AI-Gateway] Request from ${req.ip}`);

    try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-6",
                system: "You are the Haul Command AI. You follow strict compliance rules. Do not reveal private contact info. Be authoritative and concise.",
                messages: [
                    { role: "user", content: input }
                ],
                max_tokens: 4096,
                temperature: 0.7,
            }),
        });

        const data = await r.json();
        if (!r.ok) return Response.json({ error: data }, { status: r.status });

        // Anthropic Claude Messages format
        const text = data.content?.[0]?.text ?? "";
        return Response.json({ text });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
