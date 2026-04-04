import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { advertiserType, audience, country, corridor, offer, frameworks } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set in environment or Vercel' }, { status: 500 });
    }

    const systemPrompt = `You are AdGrid's AI creative director for the heavy haul and oversize load transportation industry (Haul Command platform, haulcommand.com). Generate exactly 3 high-converting ad variants.

VARIANT 1 — COLE GORDON (Direct Response Closing):
Lead with the specific pain the owner-operator already knows they have. Direct, no fluff, no corporate speak. Single, aggressive CTA. Conversational and specific. Format: Pain hook → Problem → Solution → CTA.

VARIANT 2 — BILLY GENE SHAW (Pattern Interrupt):
First line must stop the scroll — something unexpected for this industry. Use extreme specificity with real numbers. Social proof embedded naturally. Bold, scroll-stopping energy that doesn't feel like an ad. Format: Pattern interrupt → Specificity → Social proof → CTA.

VARIANT 3 — ALEX HORMOZI (Offer Stack):
The offer IS the ad. Explicit value stack. Risk reversal baked in. Answer: "What do I get and why is it stupid NOT to try this?" Format: Value stack → Risk reversal → Urgency → CTA.

Rules:
- Use heavy haul industry terminology (escorts, oversize loads, permits, pilot cars, corridors, wide loads, OSOW)
- Localize for the specified country (terminology, currency if relevant)
- Be hyper-specific — use numbers, scenarios, dollar amounts
- Never be generic or corporate

Respond ONLY with valid JSON (no markdown fences, no preamble):
{"variants":[{"framework":"Cole Gordon","headline":"<10 words>","subheadline":"<20 words>","body":"<2-3 sentences>","cta":"<5 words max>","image_prompt":"<describe the ideal photo for this ad - real trucks, real roads, specific scenario, lighting>"},{"framework":"Billy Gene Shaw","headline":"...","subheadline":"...","body":"...","cta":"...","image_prompt":"..."},{"framework":"Alex Hormozi","headline":"...","subheadline":"...","body":"...","cta":"...","image_prompt":"..."}]}`;

    const userMessage = `Advertiser type: ${advertiserType}
Target audience: ${audience}
Country/Market: ${country}
Corridor focus: ${corridor}
Offer: ${offer}
Active frameworks: ${frameworks}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Anthropic API Error: ${errText}`);
    }

    const data = await resp.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text || "";
    // Clean potential markdown wrap
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ variants: parsed.variants });
  } catch (err: any) {
    console.error("AdGrid Claude Generator Error:", err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
