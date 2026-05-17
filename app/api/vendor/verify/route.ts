import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    const { data: walletEntry, error: insertError } = await supabaseAdmin
      .from('hc_credential_wallets')
      .insert({
        company_id: companyId,
        document_type: documentType,
        document_url: fileUrl,
        verification_status: 'pending_review',
        metadata: {
          intake_source: 'vendor_verify_api',
          queued_for: 'internal_ocr_extraction',
        },
      })
      .select('id, verification_status')
      .single();

    if (insertError) {
      console.error('[vendor.verify] credential wallet insert failed:', insertError);
      return NextResponse.json(
        { error: 'Credential wallet storage unavailable. Verification was not queued.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        company_id: companyId,
        wallet_entry_id: walletEntry.id,
        status: walletEntry.verification_status,
        message: 'Credential received and queued for internal OCR extraction.'
      }
    });

  } catch (err) {
    return NextResponse.json({ error: 'Failed verification intake.' }, { status: 500 });
  }
}
