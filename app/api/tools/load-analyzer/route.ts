/**
 * POST /api/tools/load-analyzer — AI Load Intelligence Analyzer
 * 
 * Analyzes a load posting and returns:
 * - Profit Score (0-100)
 * - Risk Score (0-100)
 * - Hidden Costs (escorts, police, night restrictions)
 * - Recommendation (Accept / Negotiate / Decline)
 * 
 * Free users: Profit Score only
 * Pro users: Full report
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a heavy haul load intelligence analyst for the pilot car / escort vehicle industry.

You analyze load postings and return a structured assessment. You must return ONLY valid JSON, no markdown.

Analyze the load and return:
{
  "profitScore": number (0-100, based on rate vs typical corridor rates),
  "riskScore": number (0-100, higher = more risky),
  "profitGrade": "A" | "B" | "C" | "D" | "F",
  "riskGrade": "LOW" | "MEDIUM" | "HIGH" | "EXTREME",
  "hiddenCosts": [
    { "item": string, "estimatedCost": string, "reason": string }
  ],
  "recommendation": "ACCEPT" | "NEGOTIATE" | "DECLINE",
  "recommendationReason": string (2-3 sentences),
  "corridorInsight": string (1-2 sentences about this corridor's typical conditions),
  "rateAnalysis": {
    "offeredRate": string,
    "marketAverage": string,
    "rateVerdict": "ABOVE_MARKET" | "AT_MARKET" | "BELOW_MARKET" | "SIGNIFICANTLY_BELOW"
  },
  "escortRequirements": {
    "chaseCarsNeeded": number,
    "leadCarsNeeded": number,
    "highPoleNeeded": boolean,
    "policeEscortLikely": boolean,
    "nightRestrictions": boolean,
    "weekendRestrictions": boolean
  },
  "warnings": [string]
}

Base your analysis on industry knowledge:
- Average pilot car rate: $350-450/day, $1.50-2.00/mile
- Chase car typical: $1.40-1.80/mi
- Lead car typical: $1.50-2.00/mi  
- High pole: premium +$0.20-0.40/mi
- Police escort: $50-150/hr added cost
- Night restrictions in most states add delays = cost
- Oversize loads >14' wide or >16' tall = high risk
- Multi-state runs = permit complexity

Return ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { description, origin, destination, dimensions, weight, loadType, offeredRate } = body;

    // Build the analysis prompt
    let prompt = '';
    if (description) {
      prompt = `Analyze this load posting:\n\n${description}`;
    } else {
      prompt = `Analyze this load:\n- Origin: ${origin || 'Unknown'}\n- Destination: ${destination || 'Unknown'}\n- Dimensions: ${dimensions || 'Not specified'}\n- Weight: ${weight || 'Not specified'}\n- Load Type: ${loadType || 'Oversize'}\n- Offered Rate: ${offeredRate || 'Not specified'}`;
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
        max_tokens: 2000,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `AI error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.map((b: { text?: string }) => b.text || '').join('').trim();
    const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: clean.slice(0, 200) }, { status: 502 });
    }

    return NextResponse.json({ ok: true, analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
