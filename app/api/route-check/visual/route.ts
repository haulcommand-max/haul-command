import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType = 'image/png', context = '' } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'Missing base64Image screenshot of the route' }, { status: 400 });
    }

    const systemPrompt = `You are an expert oversize/overweight routing intelligence agent.
The user has attached a screenshot of a route map or a specific intersection/bridge.
Context provided: ${context}

Your objective is to analyze the visual data for immediate heavy-haul choke points. Look for:
- Low clearance structures (railroad bridges, skywalks)
- Extremely tight turning radii on secondary roads
- Roundabouts or traffic circles
- Construction zones or physical barriers visible on the map overlay

Provide a crisp, professional risk assessment for an oversize load traveling through this visual path. Format with bullet points. Be extremely specific to what you can visually verify in the screenshot. If no obvious hazards exist, state "No visible overhead or turning hazards detected in the provided frame."`;

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
        temperature: 0.2, // Keep factual and precise
      },
    });

    const analysis = response.text();
    if (!analysis) throw new Error("Empty response from Gemini Vision");
    
    return NextResponse.json({ success: true, analysis: analysis });

  } catch (error: any) {
    console.error('Visual Route Check Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze route screenshot', details: error.message },
      { status: 500 }
    );
  }
}
