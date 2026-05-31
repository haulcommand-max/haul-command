import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { recordLoadMatchQueue } from '@/lib/loads/load-match-queue';

type JsonRecord = Record<string, unknown>;

const asJsonRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};

const arrayField = (record: JsonRecord, key: string): JsonRecord[] => {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
};

const readString = (record: JsonRecord, key: string) => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const recordMatchingFailedFill = async (
  admin: unknown,
  loadId: string,
  reason: string,
) => {
  const rpcClient = admin as { rpc?: (fn: string, args: JsonRecord) => Promise<unknown> };
  await rpcClient.rpc?.('rpc_record_matching_failed_fill', {
    p_load_id: loadId,
    p_reason: reason,
  }).catch(() => undefined);
};

/**
 * S1-02: Load Creation Hard-Stop
 * WAVE-1 — feat(marketplace): block load visibility until escrow pre-auth [WAVE-1]
 *
 * Rules enforced at the API layer (defense-in-depth over RLS):
 * 1. Must be authenticated
 * 2. Must have kyc_tier >= 2
 * 3. Must have a Stripe customer_id on file
 * 4. Job starts as 'DRAFT' — only transitions to 'OPEN' via webhook after pre-auth lock
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const admin = getSupabaseAdmin();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!user || !session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile for KYC tier and Stripe customer
  const { data: profile } = await admin
    .from('profiles')
    .select('kyc_tier, kyc_level, stripe_customer_id, role, display_name, email')
    .eq('id', user.id)
    .single();

  // Role check
  if (profile?.role !== 'broker' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only brokers can post loads' }, { status: 403 });
  }

  // KYC tier hard-stop — use canonical kyc_tier, fall back to kyc_level
  const tier = profile?.kyc_tier ?? profile?.kyc_level ?? 0;
  if (tier < 2) {
    return NextResponse.json({
      error: 'KYC verification required to post loads',
      required_tier: 2,
      current_tier: tier,
      upgrade_url: '/settings/verification',
    }, { status: 403 });
  }

  // Stripe customer hard-stop
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({
      error: 'Payment method required to post loads',
      setup_url: '/settings/billing',
    }, { status: 403 });
  }

  // Parse load payload
  const body = await req.json();
  const {
    country = 'us',
    region = null,
    origin_city,
    origin_state,
    origin_admin1,
    destination_city,
    destination_state,
    dest_city,
    dest_state,
    dest_admin1,
    service_required = 'pevo_lead_chase',
    miles,
    rate_amount,
    budget_amount,
    requested_support_service,
    selected_provider_id,
    selected_provider_name,
    support_context,
    instant_match = false,
    status = 'active',
  } = body;

  const destinationCity = destination_city ?? dest_city;
  const countryCode = country.toString().trim().toUpperCase();
  const originAdmin1 = (origin_state ?? origin_admin1 ?? '').toString().toLowerCase();
  const destAdmin1 = (destination_state ?? dest_state ?? dest_admin1 ?? '').toString().toLowerCase();
  const amount = Number(budget_amount ?? rate_amount);
  const publishRequested = status === 'active' || status === 'published';
  const directorySupportContext = {
    support: requested_support_service ?? support_context?.support ?? service_required,
    provider_id: selected_provider_id ?? support_context?.provider_id ?? null,
    provider_name: selected_provider_name ?? support_context?.provider_name ?? null,
    role: support_context?.role ?? null,
    category: support_context?.category ?? null,
    source: support_context?.source ?? 'load_post',
  };
  const hasDirectorySupportContext = Boolean(
    directorySupportContext.provider_id ||
    directorySupportContext.provider_name ||
    directorySupportContext.support ||
    directorySupportContext.role ||
    directorySupportContext.category
  );

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: 'Valid two-letter country code required' }, { status: 400 });
  }

  if (!origin_city || !destinationCity || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'origin_city, destination_city, and budget_amount/rate_amount are required' }, { status: 400 });
  }

  const { data: countryRow } = await admin
    .from('countries')
    .select('id')
    .eq('code', countryCode)
    .maybeSingle();

  if (!countryRow?.id) {
    return NextResponse.json({ error: `Country ${countryCode} is not configured for canonical matching` }, { status: 400 });
  }

  await admin
    .from('brokers')
    .upsert({
      id: user.id,
      slug: `user-${user.id}`,
      name: profile?.display_name || profile?.email || 'Haul Command broker',
    }, { onConflict: 'id' });

  // Create a legacy/public load as draft for existing match-generate views,
  // then create a canonical hc_jobs payment target for the money path.
  const { data: load, error: loadError } = await admin
    .from('loads')
    .insert({
      broker_id: user.id,
      status: 'draft',
      posted_at: new Date().toISOString(),
      origin_country: countryCode,
      origin_admin1: originAdmin1,
      origin_city,
      dest_country: countryCode,
      dest_admin1: destAdmin1,
      dest_city: destinationCity,
      service_required,
      miles: Number.isFinite(Number(miles)) ? Number(miles) : null,
      rate_amount: amount,
      rate_currency: 'USD',
    } as never)
    .select('id')
    .single();

  if (loadError || !load) {
    return NextResponse.json({ error: loadError?.message || 'Failed to create load' }, { status: 500 });
  }

  const serviceKey = service_required.toString().toLowerCase();
  const canonicalJobType =
    serviceKey.includes('route_survey') ? 'route_survey' :
      serviceKey.startsWith('police_') || serviceKey.includes('police') ? 'police_coordination' :
        serviceKey.includes('permit') ? 'permit' :
          serviceKey.includes('traffic') ? 'traffic_control' :
            serviceKey.includes('utility') || serviceKey.includes('line_lift') ? 'utility_support' :
              serviceKey.includes('staging') || serviceKey.includes('yard') ? 'staging' :
                serviceKey.includes('escort') || serviceKey.includes('pevo') || serviceKey.includes('pilot') || serviceKey.includes('height_pole') ? 'escort' :
                  'other';

  const { data: hcJob, error: hcJobError } = await admin
    .from('hc_jobs')
    .insert({
      job_type: canonicalJobType,
      status: publishRequested ? 'pending_payment' : 'draft',
      country_id: countryRow.id,
      payload: {
        load_id: load.id,
        broker_user_id: user.id,
        country: countryCode,
        region,
        service_required,
        support_context: hasDirectorySupportContext ? directorySupportContext : null,
        selected_provider_id: directorySupportContext.provider_id,
        requested_support_service: directorySupportContext.support,
        instant_match,
      },
      priority: instant_match ? 90 : 50,
      load_type: service_required,
      origin_label: `${origin_city}${originAdmin1 ? `, ${originAdmin1.toUpperCase()}` : ''}`,
      destination_label: `${destinationCity}${destAdmin1 ? `, ${destAdmin1.toUpperCase()}` : ''}`,
      urgency_level: instant_match ? 'urgent' : 'normal',
      job_status: publishRequested ? 'quoted' : 'intake',
      customer_budget_max: amount,
      currency_code: 'USD',
      metadata: {
        canonical_source: 'broker_load_create',
        load_id: load.id,
        broker_user_id: user.id,
        country: countryCode,
        region,
        service_required,
        support_context: hasDirectorySupportContext ? directorySupportContext : null,
        selected_provider_id: directorySupportContext.provider_id,
        selected_provider_name: directorySupportContext.provider_name,
        requested_support_service: directorySupportContext.support,
        rate_total_cents: Math.round(amount * 100),
        instant_match,
      },
    } as never)
    .select('id')
    .single();

  if (hcJobError || !hcJob) {
    return NextResponse.json({
      load_id: load.id,
      status: 'canonical_job_failed',
      error: hcJobError?.message || 'Failed to create canonical job',
    }, { status: 500 });
  }

  if (!publishRequested) {
    return NextResponse.json({
      load_id: load.id,
      hc_job_id: hcJob.id,
      status: 'draft',
      note: 'Draft saved. Dispatch remains blocked until payment is authorized.',
    }, { status: 201 });
  }

  // Immediately initiate pre-auth via payments-preauth edge function
  const preAuthPayload = {
    load_id: load.id,
    job_id: hcJob.id,
    amount_cents: Math.round(amount * 100),
    broker_user_id: user.id,
    currency: 'usd',
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const preAuthRes = await fetch(`${supabaseUrl}/functions/v1/payments-preauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(preAuthPayload),
  });

  const preAuthData = await preAuthRes.json();

  if (!preAuthRes.ok || preAuthData.status === 'failed') {
    return NextResponse.json({
      load_id: load.id,
      hc_job_id: hcJob.id,
      status: 'preauth_failed',
      error: preAuthData.error || 'Payment pre-authorization failed',
      client_secret: null,
    }, { status: 402 });
  }

  const paymentAuthorized = ['authorized', 'already_authorized', 'demo_authorized'].includes(preAuthData.status);
  if (!paymentAuthorized) {
    await admin.from('hc_jobs').update({
      status: 'pending_payment',
      job_status: 'quoted',
    } as never).eq('id', hcJob.id);

    return NextResponse.json({
      load_id: load.id,
      hc_job_id: hcJob.id,
      status: 'payment_confirmation_required',
      client_secret: preAuthData.client_secret,
      payment_intent_id: preAuthData.payment_intent_id,
      instant_match,
      note: 'Payment authorization was created, but dispatch remains blocked until Stripe confirms the preauthorization.',
    }, { status: 202 });
  }

  await admin.from('loads').update({ status: 'open' }).eq('id', load.id);
  await admin.from('hc_jobs').update({
    status: 'authorized',
    job_status: 'dispatching',
  } as never).eq('id', hcJob.id);

  let matchDispatch: JsonRecord | null = null;
  let matchingQueue = null;
  if (instant_match) {
    const matchRes = await fetch(`${supabaseUrl}/functions/v1/match-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ load_id: load.id, job_id: hcJob.id, wave: 1 }),
    });
    matchDispatch = asJsonRecord(await matchRes.json().catch(() => ({})));
    const candidates = arrayField(matchDispatch, 'matches').length > 0
      ? arrayField(matchDispatch, 'matches')
      : arrayField(matchDispatch, 'offers').length > 0
        ? arrayField(matchDispatch, 'offers')
        : arrayField(matchDispatch, 'candidates');
    matchingQueue = await recordLoadMatchQueue({
      loadId: load.id,
      jobId: hcJob.id,
      countryCode,
      serviceRequired: service_required,
      wave: 1,
      candidates,
      source: 'api_loads_create_instant_match',
      edgeStatus: matchRes.status,
      edgeOk: matchRes.ok,
      error: matchRes.ok ? null : readString(matchDispatch, 'error') ?? 'instant_match_dispatch_failed',
    });
    if (!matchRes.ok) {
      await recordMatchingFailedFill(
        admin,
        load.id,
        readString(matchDispatch, 'error') ?? 'instant_match_dispatch_failed',
      );
    }
  }

  return NextResponse.json({
    load_id: load.id,
    hc_job_id: hcJob.id,
    status: preAuthData.status, // 'preauth_created' or 'demo_authorized'
    client_secret: preAuthData.client_secret,
    payment_intent_id: preAuthData.payment_intent_id,
    instant_match,
    match_dispatch: matchDispatch,
    matching_queue_recorded: matchingQueue?.recorded ?? false,
    matching_queue_rows_created: matchingQueue?.rowsCreated ?? 0,
    uncovered_alert_created: matchingQueue?.uncoveredAlertCreated ?? false,
    matching_queue_errors: matchingQueue?.errors ?? [],
    note: instant_match
      ? 'Payment gate passed and instant matching was triggered.'
      : 'Payment gate passed. Load is published and ready for matching.',
  }, { status: 201 });
}
