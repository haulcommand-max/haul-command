import { NextRequest, NextResponse } from 'next/server';
import { recordAdGridEvent, type AdGridEventType } from '@/lib/adgrid/adGridEvents';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const body = await readJsonBody(request);
    const eventType = normalizeEventType(body.eventType ?? body.event_type);
    if (!eventType) return NextResponse.json({ ok: false, error: 'Invalid AdGrid event type.' }, { status: 400 });

    const result = await recordAdGridEvent({
        eventType,
        campaignId: stringValue(body.campaignId ?? body.campaign_id),
        slotId: stringValue(body.slotId ?? body.slot_id),
        placementKey: stringValue(body.placementKey ?? body.placement_key ?? body.surface),
        pageKind: stringValue(body.pageKind ?? body.page_kind),
        pagePath: stringValue(body.pagePath ?? body.page_path) ?? request.headers.get('x-haul-command-page-path'),
        countryCode: stringValue(body.countryCode ?? body.country_code),
        stateCode: stringValue(body.stateCode ?? body.state_code),
        corridorSlug: stringValue(body.corridorSlug ?? body.corridor_code),
        audienceRole: stringValue(body.audienceRole ?? body.audience_role),
        variant: stringValue(body.variant),
        referrer: request.headers.get('referer') ?? stringValue(body.referrer),
        outcomeEvent: stringValue(body.outcomeEvent ?? body.outcome_event),
        outcomeValueCents: numberValue(body.outcomeValueCents ?? body.outcome_value_cents),
    });

    return NextResponse.json({
        ok: result.ok,
        eventType: result.eventType,
        campaignId: result.campaignId,
        slotId: result.slotId,
        eventId: result.eventId,
        error: result.ok ? undefined : result.error,
    }, { status: result.ok ? 200 : 202 });
}

export async function GET(request: NextRequest) {
    const eventType = normalizeEventType(request.nextUrl.searchParams.get('eventType') ?? request.nextUrl.searchParams.get('event_type')) as AdGridEventType | null;
    if (!eventType) return new Response(null, { status: 204 });

    const result = await recordAdGridEvent({
        eventType,
        campaignId: request.nextUrl.searchParams.get('campaignId') ?? request.nextUrl.searchParams.get('campaign_id'),
        slotId: request.nextUrl.searchParams.get('slotId') ?? request.nextUrl.searchParams.get('slot_id'),
        placementKey: request.nextUrl.searchParams.get('placementKey') ?? request.nextUrl.searchParams.get('placement_key'),
        pageKind: request.nextUrl.searchParams.get('pageKind') ?? request.nextUrl.searchParams.get('page_kind'),
        pagePath: request.nextUrl.searchParams.get('pagePath') ?? request.nextUrl.searchParams.get('page_path'),
        countryCode: request.nextUrl.searchParams.get('countryCode') ?? request.nextUrl.searchParams.get('country_code'),
        stateCode: request.nextUrl.searchParams.get('stateCode') ?? request.nextUrl.searchParams.get('state_code'),
        corridorSlug: request.nextUrl.searchParams.get('corridorSlug') ?? request.nextUrl.searchParams.get('corridor_code'),
        audienceRole: request.nextUrl.searchParams.get('audienceRole') ?? request.nextUrl.searchParams.get('audience_role'),
        variant: request.nextUrl.searchParams.get('variant'),
        referrer: request.headers.get('referer'),
        outcomeEvent: request.nextUrl.searchParams.get('outcomeEvent') ?? request.nextUrl.searchParams.get('outcome_event'),
        outcomeValueCents: numberValue(request.nextUrl.searchParams.get('outcomeValueCents') ?? request.nextUrl.searchParams.get('outcome_value_cents')),
    });

    return NextResponse.json({ ok: result.ok }, { status: result.ok ? 200 : 202 });
}

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
    try {
        const body = await request.json();
        return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
    } catch {
        return {};
    }
}

function normalizeEventType(value: unknown): AdGridEventType | null {
    if (value === 'click') return 'click';
    if (value === 'impression') return 'impression';
    if (value === 'outcome' || value === 'conversion') return 'outcome';
    return null;
}

function stringValue(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
