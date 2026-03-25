import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AUTOMATED AI PERMIT EXTRACTION (GEMINI 1.5 PRO VISION)
 * Brokers upload massive, illegible, bureaucratic PDF permits or photos.
 * Gemini Vision instantaneously extracts the core kinematics required for dispatch.
 */
export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing image payload' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Leveraging Gemini 1.5 Pro for dense OCR logistics reasoning
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    const prompt = `You are a military-grade DOT Permit extraction AI. 
    Read the provided state heavy-haul permit document and extract the exact kinematic dimensions.
    Return EXACTLY a JSON object with NO markdown formatting, NO backticks, and NO trailing text:
    {
      "width_feet": number, 
      "height_feet": number, 
      "weight_lbs": number, 
      "length_feet": number,
      "state_code": "string",
      "required_escorts": number
    }`;

    // Format the payload natively for the Gemini SDK
    const imageParts = [{ 
      inlineData: { 
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), 
        mimeType 
      } 
    }];
    
    // Execute inference
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    
    // Clean output strictly
    let text = response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return NextResponse.json({
        success: true,
        extracted_kinematics: JSON.parse(text)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
