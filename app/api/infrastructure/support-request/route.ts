import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const FALLBACK_REQUEST_TYPE = 'escort_lead';

function cleanText(value: unknown, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanCountry(value: unknown) {
    return cleanText(value, 'GLOBAL').toUpperCase();
}

function inferUrgency(text: string) {
    const lower = text.toLowerCase();
    if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('asap') || lower.includes('today')) return 'urgent';
    return 'standard';
}

function inferRequestType(input: string, bundleType: string) {
    const text = `${input} ${bundleType}`.toLowerCase();
    if (text.includes('high pole') || text.includes('height pole')) return 'high_pole_escort_needed';
    if (text.includes('permit')) return 'permit_help';
    if (text.includes('bucket')) return 'bucket_truck_support';
    if (text.includes('route') || text.includes('survey')) return 'route_survey';
    if (text.includes('repair') || text.includes('mechanic')) return 'mobile_mechanic';
    if (text.includes('parking') || text.includes('staging')) return 'staging_yard';
    if (text.includes('emergency') || text.includes('replacement')) return 'escort_emergency_replacement';
    return FALLBACK_REQUEST_TYPE;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json().catch(() => ({}));

        const bundleType = cleanText(body.bundleType || body.bundle_type, 'route');
        const description = cleanText(
            body.description || body.notes || body.raw_query || body.query,
            `Route support requested from Haul Command ${bundleType} CTA.`,
        );
        const requestedType = cleanText(body.request_type_key || body.requestTypeKey, '');
        const inferredType = inferRequestType(description, bundleType);
        const requestTypeKey = requestedType || inferredType;
        const countryCode = cleanCountry(body.country_code || body.countryCode);
        const regionCode = cleanText(body.region_code || body.regionCode || body.state, '');
        const city = cleanText(body.city || body.city_slug || body.citySlug, '');
        const corridorSlug = cleanText(body.corridor_slug || body.corridorSlug || body.corridor, '');
        const urgency = cleanText(body.urgency, inferUrgency(description));

        const { data: requestType } = await supabase
            .from('hc_route_support_request_types')
            .select('request_type_key')
            .eq('request_type_key', requestTypeKey)
            .eq('is_active', true)
            .maybeSingle();

        const finalRequestType = requestType?.request_type_key || FALLBACK_REQUEST_TYPE;
        const fingerprint = [
            'support-api',
            finalRequestType,
            countryCode,
            regionCode || 'any-region',
            city || 'any-city',
            corridorSlug || 'any-corridor',
            description.toLowerCase().slice(0, 100),
        ].join(':');

        const { data: existing } = await supabase
            .from('hc_route_support_requests')
            .select('id, fingerprint')
            .eq('fingerprint', fingerprint)
            .maybeSingle();

        if (existing?.id) {
            return NextResponse.json({ ok: true, deduped: true, request: existing }, { status: 200 });
        }

        const { data: supportRequest, error: requestError } = await supabase
            .from('hc_route_support_requests')
            .insert({
                request_type_key: finalRequestType,
                title: cleanText(body.title, 'Route support request'),
                description,
                country_code: countryCode,
                region_code: regionCode || null,
                city: city || null,
                corridor_slug: corridorSlug || null,
                urgency,
                requester_role: cleanText(body.requester_role || body.requesterRole, '') || null,
                requester_company: cleanText(body.requester_company || body.requesterCompany, '') || null,
                requester_phone: cleanText(body.requester_phone || body.requesterPhone, '') || null,
                requester_email: cleanText(body.requester_email || body.requesterEmail, '') || null,
                contact_routing_preference: 'haul_command_router',
                visibility: cleanText(body.visibility, 'internal'),
                status: 'new',
                matched_provider_count: 0,
                unlocked_lead_count: 0,
                monetization_path: 'intent_to_dispatch',
                boost_active: false,
                seo_indexable: false,
                fingerprint,
                spam_score: 0,
                abuse_report_count: 0,
            })
            .select('id, request_type_key, country_code, region_code, city, corridor_slug, urgency, status, fingerprint')
            .single();

        if (requestError) {
            return NextResponse.json({ ok: false, error: requestError.message }, { status: 400 });
        }

        await supabase.from('hc_demand_intent_signals').insert({
            signal_kind: 'route_support_request',
            origin_country_code: countryCode === 'GLOBAL' ? null : countryCode,
            origin_region_code: regionCode || null,
            origin_city: city || null,
            role_key_needed: finalRequestType,
            urgency_label: urgency,
            source_record_id: supportRequest.id,
            source_table: 'hc_route_support_requests',
            metadata: {
                bundleType,
                description,
                corridor_slug: corridorSlug || null,
                capture_endpoint: '/api/infrastructure/support-request',
            },
        });

        return NextResponse.json({ ok: true, deduped: false, request: supportRequest }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { ok: false, error: 'Route support capture failed', details: error?.message },
            { status: 500 },
        );
    }
}
