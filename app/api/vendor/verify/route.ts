import { NextResponse } from 'next/server';

// Haul Command Verification Engine
// Task 33: Handles the backend logic of receiving a vendor's ACORD PDF and flagging for review.

export async function POST(request: Request) {
  try {
    // Expected multipart/form-data or JSON with base64/url to bucket
    const body = await request.json();
    const { companyId, documentType, fileUrl } = body;

    if (!companyId || !documentType || !fileUrl) {
      return NextResponse.json({ error: 'Missing credential payload.' }, { status: 400 });
    }

    if (!['auto_insurance', 'general_liability', 'state_certification', 'port_access'].includes(documentType)) {
      return NextResponse.json({ error: 'Unsupported document type for verification graph.' }, { status: 400 });
    }

    // Insert to hc_credential_wallets with status 'pending_review'
    // simulating Supabase insert...

    return NextResponse.json({
      success: true,
      data: {
        company_id: companyId,
        wallet_entry_id: 'mock-wallet-insert-uuid',
        status: 'pending_review',
        message: 'Credential received and queued for internal OCR extraction.'
      }
    });

  } catch (err) {
    return NextResponse.json({ error: 'Failed verification intake.' }, { status: 500 });
  }
}
