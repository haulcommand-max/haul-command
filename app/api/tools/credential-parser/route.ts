import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google GenAI SDK (Gemini 2.0 Flash for Multimodal)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /api/tools/credential-parser
 * Uses Gemini Vision to extract structured data from an uploaded insurance/DOT credential image.
 */
export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType = 'image/jpeg', targetDocumentType = 'insurance' } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'Missing base64Image in request body' }, { status: 400 });
    }

    const systemPrompt = `You are an expert AI extraction agent for the heavy haul trucking industry. 
Your job is to read credentials (insurance certificates, DOT authority letters, or driver licenses) and output pure JSON.
The requested document type is: ${targetDocumentType}.
Extract all readable text relating to the business entity, expiration dates, limits of liability, USDOT numbers, MC numbers, and any pilot car specific endorsements.

Return ONLY a JSON object with this shape (omit missing fields, do NOT wrap in markdown \`\`\`json):
{
  "entityName": "string",
  "dbaName": "string",
  "usdotNumber": "string",
  "mcNumber": "string",
  "expirationDate": "YYYY-MM-DD",
  "insuranceLimits": {
    "autoLiability": "number",
    "generalLiability": "number",
    "cargo": "number"
  },
  "statesLicensed": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        systemPrompt,
        {
          inlineData: {
            data: base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, ''),
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temp for maximum factual extraction
      },
    });

    const textPayload = response.text;
    if (!textPayload) throw new Error("Empty response from Gemini Vision");
    
    // Attempt to parse exactly as JSON
    const parsedData = JSON.parse(textPayload.trim());
    
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Credential Parse Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse credential image', details: error.message },
      { status: 500 }
    );
  }
}
