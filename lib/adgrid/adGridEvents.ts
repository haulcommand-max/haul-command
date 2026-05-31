import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AdGridEventType = 'impression' | 'click' | 'outcome';

export type AdGridEventInput = {
    eventType: AdGridEventType;
    campaignId?: string | null;
    slotId?: string | null;
    placementKey?: string | null;
    pageKind?: string | null;
    pagePath?: string | null;
    countryCode?: string | null;
    stateCode?: string | null;
    corridorSlug?: string | null;
    audienceRole?: string | null;
    variant?: string | null;
    referrer?: string | null;
    outcomeEvent?: string | null;
    outcomeValueCents?: number | null;
};

export type AdGridEventResult = {
    ok: boolean;
    eventType: AdGridEventType;
    campaignId?: string;
    slotId?: string | null;
    eventId?: string;
    error?: string;
};

type CampaignCandidate = {
    id: string;
    target_country?: string | null;
    target_countries?: string[] | null;
    status?: string | null;
    impressions?: number | null;
    clicks?: number | null;
};

type SlotCandidate = {
    id: string;
    page_kind?: string | null;
    placement_key?: string | null;
    is_active?: boolean | null;
};

export async function recordAdGridEvent(input: AdGridEventInput, supabase = getServerSupabaseClient()): Promise<AdGridEventResult> {
    if (!supabase) return { ok: false, eventType: input.eventType, error: 'Supabase service credentials are not configured.' };

    const payload = normalizeAdGridEventInput(input);
    const campaign = await resolveCampaign(supabase, payload);
    if (!campaign) return { ok: false, eventType: payload.eventType, error: 'No active AdGrid campaign is available for event recording.' };

    const slotId = payload.slotId ?? await resolveSlotId(supabase, payload);
    const insertPayload = payload.eventType === 'impression'
        ? {
            campaign_id: campaign.id,
            slot_id: slotId,
            page_path: payload.pagePath,
            country_code: payload.countryCode,
            state_code: payload.stateCode,
            corridor_slug: payload.corridorSlug,
            audience_role: payload.audienceRole,
            variant: payload.variant,
        }
        : payload.eventType === 'click'
            ? {
            campaign_id: campaign.id,
            slot_id: slotId,
            page_path: payload.pagePath,
            country_code: payload.countryCode,
            state_code: payload.stateCode,
            audience_role: payload.audienceRole,
            variant: payload.variant,
            referrer: payload.referrer,
            }
            : {
                campaign_id: campaign.id,
                outcome_event: payload.outcomeEvent ?? 'sponsor_activation_request_started',
                outcome_value_cents: payload.outcomeValueCents,
                metadata: {
                    slot_id: slotId,
                    page_path: payload.pagePath,
                    country_code: payload.countryCode,
                    state_code: payload.stateCode,
                    corridor_slug: payload.corridorSlug,
                    audience_role: payload.audienceRole,
                    variant: payload.variant,
                    referrer: payload.referrer,
                },
            };

    const table = payload.eventType === 'impression' ? 'hc_adgrid_impressions' : payload.eventType === 'click' ? 'hc_adgrid_clicks' : 'hc_adgrid_outcome_events';
    const { data, error } = await supabase.from(table).insert(insertPayload as Record<string, unknown>).select('id').single();
    if (error) return { ok: false, eventType: payload.eventType, campaignId: campaign.id, slotId, error: error.message };

    await incrementCampaignCounter(supabase, campaign, payload.eventType);

    return {
        ok: true,
        eventType: payload.eventType,
        campaignId: campaign.id,
        slotId,
        eventId: data?.id ? String(data.id) : undefined,
    };
}

export function normalizeAdGridEventInput(input: AdGridEventInput): Required<Pick<AdGridEventInput, 'eventType'>> & Omit<AdGridEventInput, 'eventType'> {
    return {
        eventType: input.eventType,
        campaignId: uuidOrNull(input.campaignId),
        slotId: uuidOrNull(input.slotId),
        placementKey: cleanText(input.placementKey, 80),
        pageKind: cleanText(input.pageKind, 50),
        pagePath: cleanPath(input.pagePath),
        countryCode: cleanText(input.countryCode, 8)?.toUpperCase() ?? null,
        stateCode: cleanText(input.stateCode, 24)?.toUpperCase() ?? null,
        corridorSlug: slugText(input.corridorSlug, 120),
        audienceRole: slugText(input.audienceRole, 120),
        variant: slugText(input.variant, 120),
        referrer: cleanText(input.referrer, 500),
        outcomeEvent: slugText(input.outcomeEvent, 120),
        outcomeValueCents: integerOrNull(input.outcomeValueCents),
    };
}

async function resolveCampaign(supabase: SupabaseClient, input: ReturnType<typeof normalizeAdGridEventInput>): Promise<CampaignCandidate | null> {
    if (input.campaignId) {
        const { data } = await supabase
            .from('hc_adgrid_campaign')
            .select('id,target_country,target_countries,status,impressions,clicks')
            .eq('id', input.campaignId)
            .maybeSingle();
        if (data?.id) return data as CampaignCandidate;
    }

    const { data } = await supabase
        .from('hc_adgrid_campaign')
        .select('id,target_country,target_countries,status,impressions,clicks,created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(25);

    const candidates = (data ?? []) as CampaignCandidate[];
    if (!candidates.length) return null;
    const country = input.countryCode;
    return candidates.find((candidate) => country && campaignTargetsCountry(candidate, country)) ?? candidates[0] ?? null;
}

async function resolveSlotId(supabase: SupabaseClient, input: ReturnType<typeof normalizeAdGridEventInput>): Promise<string | null> {
    if (!input.placementKey && !input.pageKind) return null;
    let query = supabase
        .from('hc_adgrid_page_slots')
        .select('id,page_kind,placement_key,is_active')
        .eq('is_active', true)
        .limit(10);
    if (input.placementKey) query = query.eq('placement_key', input.placementKey);
    if (input.pageKind) query = query.eq('page_kind', input.pageKind);
    const { data } = await query;
    const slot = ((data ?? []) as SlotCandidate[])[0];
    return slot?.id ?? null;
}

async function incrementCampaignCounter(supabase: SupabaseClient, campaign: CampaignCandidate, eventType: AdGridEventType) {
    if (eventType === 'outcome') return;
    const current = eventType === 'impression' ? Number(campaign.impressions ?? 0) : Number(campaign.clicks ?? 0);
    const field = eventType === 'impression' ? 'impressions' : 'clicks';
    await supabase
        .from('hc_adgrid_campaign')
        .update({ [field]: current + 1, updated_at: new Date().toISOString() })
        .eq('id', campaign.id);
}

function campaignTargetsCountry(campaign: CampaignCandidate, country: string) {
    if (campaign.target_country?.toUpperCase() === country) return true;
    return Array.isArray(campaign.target_countries) && campaign.target_countries.some((item) => item?.toUpperCase() === country);
}

function uuidOrNull(value: unknown) {
    const cleaned = cleanText(value, 80);
    return cleaned && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned) ? cleaned : null;
}

function cleanPath(value: unknown) {
    const cleaned = cleanText(value, 300);
    if (!cleaned) return null;
    if (/^https?:\/\//i.test(cleaned)) {
        try {
            const url = new URL(cleaned);
            return `${url.pathname}${url.search}`.slice(0, 300);
        } catch {
            return null;
        }
    }
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function slugText(value: unknown, maxLength: number) {
    const cleaned = cleanText(value, maxLength);
    return cleaned?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || null;
}

function cleanText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
    return cleaned ? cleaned.slice(0, maxLength) : null;
}

function integerOrNull(value: unknown) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.round(parsed));
}

function getServerSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
