import { NextResponse } from 'next/server';

// Optional: Import a Node.js library for Gemini if installed, or use raw fetch.
// const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini Vision Permit Extraction API
 * Converts photos/PDFs of state/provincial oversize permits into structured JSON matching HaulCommand's routing engine schema.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const permitImage = formData.get('permit') as File | null;
    
    if (!permitImage) {
      return NextResponse.json({ error: 'No permit image uploaded' }, { status: 400 });
    }

    // Convert to base64 for Gemini payload
    const buffer = Buffer.from(await permitImage.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = permitImage.type || 'image/jpeg';

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      // Return a simulated response if running in an environment without keys
      return NextResponse.json({
        extractedStatus: 'simulated_success',
        data: {
          permit_number: 'TX-2026-99381A',
          state: 'TX',
          issue_date: '2026-04-01',
          expire_date: '2026-04-14',
          max_width: '14ft 6in',
          max_height: '14ft 2in',
          max_weight_lbs: 120500,
          mandatory_escorts: {
            front: 1,
            rear: 1,
            police: 0,
          },
          curfew_restrictions: ['No movement Sunset to Sunrise', 'No movement in Houston Metro 6AM-9AM / 4PM-7PM'],
          approved_route_nodes: ['I-10 E', 'US-59 N', 'TX-146 S']
        }
      });
    }

    // Actual Google Gemini 1.5 Flash/Pro Vision Request
    const promptText = `
      You are an expert logistics coordinator and DOT permit clerk.
      Extract the following structured information from this oversize/overweight load permit image:
      - Permit Number
      - Exact State/Province of issue
      - Issue Date and Expiration Date
      - Allowed Dimensions (Width, Height, Length). Convert everything strictly to imperial inches and numeric strings.
      - Max Gross Weight (lbs)
      - Mandatory Escort Count (Front, Rear, Police)
      - Explicit Curfew or Holiday Restrictions
      - The Approved Route Line-by-Line 
      
      Respond STRICTLY in pure JSON matching this exact structure: 
      { "permit_number": string, "state": string, "issue_date": string, "expire_date": string, "max_width": string, "max_height": string, "max_weight_lbs": number, "mandatory_escorts": { "front": number, "rear": number, "police": number }, "curfew_restrictions": string[], "approved_route_nodes": string[] }
    `;

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Parse the JSON strictly
    let parsedData = {};
    if (extractedText) {
      try {
        parsedData = JSON.parse(extractedText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.warn('Failed to parse Gemini output strictly', extractedText);
        parsedData = { rawText: extractedText };
      }
    }

    return NextResponse.json({ success: true, data: parsedData });

  } catch (err: any) {
    console.error('Gemini Vision Extraction Error:', err);
    return NextResponse.json({ error: 'Failed to process permit image.' }, { status: 500 });
  }
}
