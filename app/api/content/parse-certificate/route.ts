import { NextRequest, NextResponse } from 'next/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content/parse-certificate
 * Body: { image_base64: string, mime_type?: string } OR { image_url: string }
 *
 * Gemini Vision parses insurance certificates, DOT authority letters,
 * CDL copies, and operator credentials.
 *
 * Cost: ~$0.001 per image (Gemini 2.0 Flash vision)
 * Supported: JPEG, PNG, PDF-as-image, WebP
 *
 * Returns structured credential data:
 *   - Insured name, company
 *   - Policy number, carrier
 *   - Coverage type and amount
 *   - Effective + expiry dates
 *   - Valid flag (not expired)
 *   - Any issues detected
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { image_base64, image_url, mime_type = 'image/jpeg' } = body;

  if (!image_base64 && !image_url) {
    return NextResponse.json({ error: 'Provide image_base64 or image_url' }, { status: 400 });
  }

  const imageInput = image_base64
    ? [{ base64: image_base64, mimeType: mime_type }]
    : [{ url: image_url, mimeType: mime_type }];

  const prompt = `Analyze this document (insurance certificate, DOT authority letter, CDL, or operator credential).\n\nExtract ALL visible fields and output ONLY this JSON:\n{\n  "document_type": "insurance_cert" | "dot_authority" | "cdl" | "other",\n  "insured_name": string | null,\n  "company": string | null,\n  "policy_number": string | null,\n  "carrier": string | null,\n  "coverage_type": string | null,\n  "coverage_amount_usd": number | null,\n  "effective_date": "YYYY-MM-DD" | null,\n  "expiry_date": "YYYY-MM-DD" | null,\n  "issued_date": "YYYY-MM-DD" | null,\n  "license_number": string | null,\n  "dot_number": string | null,\n  "valid": boolean,\n  "days_until_expiry": number | null,\n  "issues": string[],\n  "raw_text_excerpt": string\n}\n\nFor "valid": set to false if expiry_date is in the past or document shows cancellation.\nFor "issues": list anything suspicious (blurry text, altered fields, mismatched dates, etc.)`;

  try {
    const res = await tracked('parse_certificate', () =>
      see(prompt, {
        tier: 'fast',
        json: true,
        images: imageInput,
        maxTokens: 500,
        system: 'You are a document verification specialist for a transportation compliance platform. Be precise. Flag any anomalies.',
      })
    );

    let parsed: any = {};
    try { parsed = JSON.parse(res.text); } catch { parsed = { error: 'Parse failed', raw: res.text }; }

    // Auto-flag expired documents
    if (parsed.expiry_date) {
      const expiry = new Date(parsed.expiry_date);
      const now = new Date();
      parsed.valid = expiry > now;
      parsed.days_until_expiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    }

    return NextResponse.json({
      ...parsed,
      model: res.model,
      latency_ms: res.latency_ms,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
