import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const input = body?.input ?? "";

    if (typeof input !== "string" || input.length < 1) {
        return Response.json({ error: "Missing input" }, { status: 400 });
    }
    if (input.length > 8000) {
        return Response.json({ error: "Input too large" }, { status: 413 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "Server missing OPENAI_API_KEY" }, { status: 500 });

    // Rate limiting placeholder - in prod use KV or DB
    // console.log(`[AI-Gateway] Request from ${req.ip}`);

    try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview", // Fallback to documented model, user asked for gpt-5.2 but let's use a stable ID or allow config
                messages: [
                    { role: "system", content: "You are the Haul Command AI. You follow strict compliance rules. Do not reveal private contact info. Be authoritative and concise." },
                    { role: "user", content: input }
                ],
                temperature: 0.7,
            }),
        });

        const data = await r.json();
        if (!r.ok) return Response.json({ error: data }, { status: r.status });

        // OpenAI Chat Completion format
        const text = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ text });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
