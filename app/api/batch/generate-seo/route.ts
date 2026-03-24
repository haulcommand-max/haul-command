import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Requires service role to forcefully update any active operator SEO without RLS blocks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /api/batch/generate-seo
 * Process a batch of up to 50 directory operators to auto-generate SEO meta_descriptions 
 * using Gemini 2.0 Flash Lite ($0.0003 / 1k tokens - ultra cheap high volume).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Fetch operators missing a meta description.
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, full_name, company_name, city, state, services, equipment')
      .is('meta_description', null)
      .eq('active', true)
      .limit(50); // Small batches to avoid timeout

    if (error) throw new Error(`Supabase select error: ${error.message}`);
    if (!listings || listings.length === 0) {
      return NextResponse.json({ message: 'No active listings need SEO generation. Batch complete!' });
    }

    let successes = 0;
    let failures = 0;

    // 2. Loop and hit Gemini 2.0 Flash Lite
    // In production, you might want to map() thru Promise.allSettled to parallelize.
    const updatePromises = listings.map(async (operator) => {
      try {
        const title = operator.company_name || operator.full_name || 'Heavy Haul Escort';
        const location = [operator.city, operator.state].filter(Boolean).join(', ') || 'Nationwide';
        const equipment = operator.equipment?.join(', ') || 'specialized escort vehicles';

        const prompt = `Write a high-converting 140-160 character SEO meta description for a heavy haul pilot car / escort operator.
Business Name: ${title}
Location: ${location}
Equipment/Services: ${equipment}

Rules:
- Max 160 chars.
- Professional, authoritative tone.
- MUST include their location keywords.
- Do NOT use emojis.
- Do NOT include wrapping quotes in the output.`;

        // Using Flash Lite to keep the 7,745 generation cost under $1.00
        const res = await ai.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: prompt,
        });

        const metaText = res.text()?.trim().replace(/^"|"$/g, '');

        if (!metaText) throw new Error('Empty Gemini output');

        // Back to db
        const { error: updateError } = await supabase
          .from('listings')
          .update({ meta_description: metaText })
          .eq('id', operator.id);
          
        if (updateError) throw updateError;
        successes++;

      } catch (err) {
        console.error(`Error processing operator ${operator.id}:`, err);
        failures++;
      }
    });

    await Promise.allSettled(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Batch processed ${listings.length} listings.`,
      stats: { successes, failures }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
