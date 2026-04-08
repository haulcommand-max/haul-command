import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'edge';

// ══════════════════════════════════════════════════════════════
// POST /api/webhooks/generate-alt
// Supabase Webhook: Fires when a new row is inserted into hc_operator_images.
// Invokes Gemini 3.5 Pro to generate a highly semantic, SEO-rich
// alt-text describing the pilot car/truck for image pack domination.
// ══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
    try {
        // Parse Supabase Webhook Payload
        // Expected payload format for inserts: { type: 'INSERT', table: 'hc_operator_images', record: { id, url, operator_id, alt_text: null } }
        const payload = await req.json();

        if (payload.type !== 'INSERT' || !payload.record || payload.record.alt_text) {
            return NextResponse.json({ message: 'Skipped - not an insert or alt-text already exists' });
        }

        const imageId = payload.record.id;
        const imageUrl = payload.record.url; // Assuming public URL or accessible signed URL

        if (!imageUrl) {
            return NextResponse.json({ message: 'No URL found' }, { status: 400 });
        }

        // Initialize Gemini via latest SDK
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[Webhooks:AltText] Missing GEMINI_API_KEY');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Download the image as base64 for Gemini payload
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

        // Prompt Gemini to analyze the pilot car/truck
        const prompt = `
            You are a heavy haul SEO expert. Analyze this image of a pilot car / escort vehicle. 
            Write a concise, highly descriptive 'alt text' for this image that would help it rank in Google Image Search for terms like "pilot car", "escort vehicle", "oversize load escort", etc. 
            Include visible details like the truck make/model, color, mounted equipment (high pole, beacons, signs), and environment if relevant. 
            Output ONLY the raw string value to be used directly in an HTML alt="" attribute. Max 125 characters. 
            Do not include quotes around the output.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-pro', // Using cheap/fast model per Haul Command spec
            contents: [
                prompt,
                { inlineData: { data: base64Data, mimeType } }
            ]
        });

        let generatedAlt = response.text?.trim() || '';

        // Strip quotes if Gemini accidentally included them
        if (generatedAlt.startsWith('"') && generatedAlt.endsWith('"')) {
            generatedAlt = generatedAlt.slice(1, -1);
        }

        if (!generatedAlt) {
            throw new Error('Gemini returned empty response');
        }

        // Update the Supabase record
        const supabase = getSupabaseAdmin();
        const { error: dbError } = await supabase
            .from('hc_operator_images') // Assuming the table name
            .update({ 
                alt_text: generatedAlt,
                ai_generated: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', imageId);

        if (dbError) {
            throw new Error(`Supabase update failed: ${dbError.message}`);
        }

        return NextResponse.json({ 
            success: true, 
            altText: generatedAlt,
            imageId
        });
        
    } catch (error: any) {
        console.error(`[Webhooks:AltText] Pipeline failed:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
