import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface DocumentValidationResult {
  valid: boolean;
  confidenceScore: number;
  extractedData: Record<string, any>;
  fraudFlags: string[];
  reason: string;
}

/**
 * 15X SOLUTION: Zero-Trust Multi-Modal LLM Execution
 * Rents out human QA analysis entirely. Uses Gemini Pro Vision to structurally OCR
 * documents, check for Photoshop artifacts, match identity fields, and extract expiration dates.
 */
export async function validateComplianceDocument(
  imageUrl: string,
  expectedDocType: "coi" | "pilot_car_cert" | "cdl",
  expectedName: string
): Promise<DocumentValidationResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 1. Fetch the image buffer
    const imgResp = await fetch(imageUrl);
    const arrayBuffer = await imgResp.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 2. Init Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 3. Define the strict instruction prompt
    const prompt = `
      You are an elite, zero-trust fraud detection analyst for a logistics marketplace.
      Analyze this image, which claims to be a ${expectedDocType.toUpperCase()}.
      
      Expected Name on Document: "${expectedName}"

      Perform the following forensic analysis:
      1. OCR all text perfectly.
      2. Check if the name matches the expected name (allow minor abbreviations).
      3. Find the Expiration Date. Is it expired based on the current date of ${new Date().toISOString()}?
      4. Check for obvious signs of digital manipulation, photoshop artifacts, or mismatching fonts.
      5. Verify it looks structurally correct for a standard US ${expectedDocType}.
      
      Return ONLY a JSON block with the following exact structure in a markdown codeblock. Do not include any other text:
      {
        "valid": boolean (true if genuine, unexpired, and matches name),
        "confidenceScore": number (0-100),
        "extractedData": {
          "name": "string",
          "expirationDate": "YYYY-MM-DD",
          "policyNumber": "string if applicable"
        },
        "fraudFlags": ["list of strings denoting any suspicious artifacts, mismatches, or expirations"],
        "reason": "String explaining the verdict"
      }
    `;

    // 4. Execute Multi-Modal Call
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } } // Assume jpeg/png
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error("Failed to parse LLM JSON response");
    }

    const payload: DocumentValidationResult = JSON.parse(jsonMatch[1]);
    return payload;
    
  } catch (err: any) {
    console.error("[ZeroTrustVision] Validation fault:", err.message);
    return {
      valid: false,
      confidenceScore: 0,
      extractedData: {},
      fraudFlags: ["SYSTEM_ERROR"],
      reason: err.message
    };
  }
}

/**
 * Executes async analysis and applies trust score adjustments immediately to the ledger.
 */
export async function executeDocumentVerificationHook(userId: string, docId: string, imageUrl: string, docType: "coi" | "pilot_car_cert" | "cdl") {
    const supabase = getSupabaseAdmin();
    
    // Fetch user to match name
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
    if (!profile) return;

    const analysis = await validateComplianceDocument(imageUrl, docType, profile.display_name);

    if (analysis.valid && analysis.confidenceScore > 85) {
        // Boost trust
        await supabase.from("dispute_trust_impacts").insert({
            user_id: userId,
            trust_score_delta: 5,
            impact_type: `${docType}_auto_verified`,
            notes: `Gemini Vision confirmed ${docType} structural integrity.`
        });
        
        // Update document status
        await supabase.from("user_compliance_docs").update({
            status: 'verified',
            extracted_metadata: analysis.extractedData,
            verified_at: new Date().toISOString()
        }).eq("id", docId);
    } else {
        // Flag for human review / block
        await supabase.from("user_compliance_docs").update({
            status: 'rejected',
            fraud_flags: analysis.fraudFlags,
            reviewer_notes: analysis.reason
        }).eq("id", docId);

        // Deduct trust if highly confident it's fraud
        if (analysis.fraudFlags.includes("digital_manipulation") || analysis.fraudFlags.includes("name_mismatch")) {
            await supabase.from("dispute_trust_impacts").insert({
                user_id: userId,
                trust_score_delta: -10,
                impact_type: `${docType}_fraud_detected`,
                notes: `Zero-Trust Engine rejected ${docType}: ${analysis.reason}`
            });
        }
    }
}
