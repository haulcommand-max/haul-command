/**
 * GET /api/sms/smart-link?operator_id=xxx
 * Generates a trackable short link via Dub.co that detects iOS/Android/Desktop
 * and redirects to the appropriate store or web page.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
// Placeholder store URLs — update once published
const IOS_URL = process.env.APP_STORE_URL || `${SITE}/download/ios`;
const ANDROID_URL = process.env.PLAY_STORE_URL || `${SITE}/download/android`;
const DESKTOP_URL = `${SITE}/download`;

export async function GET(req: NextRequest) {
    const opId = req.nextUrl.searchParams.get('operator_id');
    const campaign = req.nextUrl.searchParams.get('campaign') || 'sms';

    // Build the destination URL with tracking
    const claimUrl = `${SITE}/claim${opId ? `?id=${opId}` : ''}`;

    // Try Dub.co if configured
    if (process.env.DUB_API_KEY) {
        try {
            const res = await fetch('https://api.dub.co/links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DUB_API_KEY}`,
                },
                body: JSON.stringify({
                    url: claimUrl,
                    ios: IOS_URL,
                    android: ANDROID_URL,
                    tagIds: [],
                    externalId: opId || undefined,
                    utm_source: 'sms',
                    utm_medium: campaign,
                }),
            });
            const link = await res.json();
            if (link.shortLink) {
                // Track event (fire-and-forget, ignore errors)
                const admin = getSupabaseAdmin();
                try {
                    await admin.from('hc_events').insert({
                        event: 'smart_link_generated',
                        metadata: { operator_id: opId, campaign, short_link: link.shortLink },
                    });
                } catch { /* non-critical tracking — ignore */ }

                return NextResponse.json({ ok: true, short_link: link.shortLink, ios: IOS_URL, android: ANDROID_URL, desktop: DESKTOP_URL });
            }
        } catch (e) { /* fall through to plain URL */ }
    }

    // Fallback: return plain claim URL
    return NextResponse.json({ ok: true, short_link: claimUrl, ios: IOS_URL, android: ANDROID_URL, desktop: DESKTOP_URL, note: 'Dub.co not configured — using plain URL' });
}
