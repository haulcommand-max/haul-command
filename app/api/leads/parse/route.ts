/**
 * POST /api/leads/parse — AI Lead Parser v3
 * 
 * Accepts raw load board text, uses Claude to extract structured leads
 * with role inference (broker vs operator). Returns JSON array.
 * 
 * Server-side to keep API key secure.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a data extraction specialist for a heavy haul pilot car load board that operates globally.

CRITICAL ROLE LOGIC — get this right:
- If the post says they NEED a Chase/Lead/High Pole/Steer → posterRole = "broker" (they are hiring an escort)
- If the post says they ARE AVAILABLE or CAN DO Chase/Lead etc → posterRole = "operator" (they are an escort looking for work)
- Most load board posts are brokers looking for escorts
- Companies with "Pilot Car", "PCS", "Escort" in their name CAN still be brokers if they are posting a load needing someone else

Extract every entity and return ONLY a valid JSON array. No markdown, no backticks.

Each object:
- company: string
- phone: string (digits only e.g. "4698047715" or "")
- origin: string ("City, STATE" or "")
- destination: string ("City, STATE" or "")
- rate: string ("$1.80/mi" | "$1300 total" | "Contact for rate" | "")
- jobType: string (Chase | Lead | High Pole | Steer | Route Survey | Third Car | Unknown)
- distance: string (numeric miles only e.g. "761" or "")
- quickPay: boolean
- posterRole: string ("broker" | "operator")  ← MOST IMPORTANT FIELD
- notes: string (ASAP, text only, day rate, NY certified, etc.)

Return ONLY the JSON array.`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json({ error: 'Provide load board text (min 10 chars)' }, { status: 400 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5000,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[leads/parse] Claude API error:', res.status, errText.slice(0, 200));
      return NextResponse.json({ error: `AI parsing failed (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const rawText = data.content?.map((b: { text?: string }) => b.text || '').join('').trim();
    const clean = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let leads;
    try {
      leads = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: clean.slice(0, 200) }, { status: 502 });
    }

    return NextResponse.json({ ok: true, leads, count: leads.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
