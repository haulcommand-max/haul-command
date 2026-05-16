import { NextRequest, NextResponse } from 'next/server';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type ClaimInput = {
  directoryId: string;
  claimantName: string;
  workEmail: string;
  taxId: string;
  claimantPhone?: string;
  claimantRole?: string;
  source?: string;
};

function cleanString(value: FormDataEntryValue | unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function parseClaimInput(request: NextRequest): Promise<ClaimInput> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    return {
      directoryId: cleanString(body.directoryId || body.place_id || body.placeId || body.listing_id),
      claimantName: cleanString(body.claimantName || body.claimant_name),
      workEmail: cleanString(body.workEmail || body.work_email || body.email).toLowerCase(),
      taxId: cleanString(body.taxId || body.tax_id || body.business_id),
      claimantPhone: cleanString(body.claimantPhone || body.claimant_phone || body.phone) || undefined,
      claimantRole: cleanString(body.claimantRole || body.claimant_role || body.role) || undefined,
      source: cleanString(body.source) || undefined,
    };
  }

  const formData = await request.formData();
  return {
    directoryId: cleanString(formData.get('directoryId') || formData.get('place_id') || formData.get('placeId') || formData.get('listing_id')),
    claimantName: cleanString(formData.get('claimantName') || formData.get('claimant_name')),
    workEmail: cleanString(formData.get('workEmail') || formData.get('work_email') || formData.get('email')).toLowerCase(),
    taxId: cleanString(formData.get('taxId') || formData.get('tax_id') || formData.get('business_id')),
    claimantPhone: cleanString(formData.get('claimantPhone') || formData.get('claimant_phone') || formData.get('phone')) || undefined,
    claimantRole: cleanString(formData.get('claimantRole') || formData.get('claimant_role') || formData.get('role')) || undefined,
    source: cleanString(formData.get('source')) || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseClaimInput(request);

    if (!input.directoryId || !input.claimantName || !input.workEmail || !input.taxId) {
      return NextResponse.json({ error: 'Missing required claim parameters.' }, { status: 400 });
    }

    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required before submitting a directory claim.' }, { status: 401 });
    }

    if (!isEmailConfirmed(user)) {
      return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { data: place, error: placeError } = await admin
      .from('hc_places')
      .select('id, name, claim_status')
      .eq('id', input.directoryId)
      .maybeSingle();

    if (placeError) {
      return NextResponse.json({ error: 'Failed to verify directory listing.' }, { status: 500 });
    }

    if (!place) {
      return NextResponse.json({ error: 'Directory listing not found.' }, { status: 404 });
    }

    if (place.claim_status === 'verified') {
      return NextResponse.json({ error: 'This listing is already verified.' }, { status: 409 });
    }

    const { data: existingClaim, error: existingError } = await admin
      .from('hc_claim_requests')
      .select('id, status')
      .eq('place_id', input.directoryId)
      .eq('requester_user_id', user.id)
      .in('status', ['pending', 'verified'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: 'Failed to check existing claim request.' }, { status: 500 });
    }

    if (existingClaim) {
      return NextResponse.json({
        success: true,
        claim_request_id: existingClaim.id,
        listing_id: input.directoryId,
        status: existingClaim.status,
        message: 'A claim request for this listing is already under review.',
      }, { status: 200 });
    }

    const { data: claim, error: claimError } = await admin
      .from('hc_claim_requests')
      .insert({
        place_id: input.directoryId,
        requester_user_id: user.id,
        status: 'pending',
        evidence: {
          claimant_name: input.claimantName,
          work_email: input.workEmail,
          claimant_phone: input.claimantPhone || null,
          claimant_role: input.claimantRole || null,
          business_id_last4: input.taxId.slice(-4),
          listing_name: place.name,
          source: input.source || 'directory_claim_api',
          submitted_at: new Date().toISOString(),
        },
      })
      .select('id, status')
      .single();

    if (claimError) {
      return NextResponse.json({ error: 'Failed to persist directory claim request.' }, { status: 500 });
    }

    await admin
      .from('hc_places')
      .update({ claim_status: 'pending' })
      .eq('id', input.directoryId)
      .in('claim_status', ['unclaimed', 'rejected', 'revoked'])
      .then(() => undefined);

    return NextResponse.json({
      success: true,
      claim_request_id: claim.id,
      listing_id: input.directoryId,
      status: claim.status,
      message: 'Claim request submitted for moderation. Approval is not automatic.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process directory claim request.' }, { status: 500 });
  }
}
