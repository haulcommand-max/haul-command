export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { profileId, viewerId } = await req.json();

        if (!profileId) {
            return Response.json({ error: 'Missing profileId' }, { status: 400 });
        }

        // We don't view our own profile to trigger alerts
        if (profileId === viewerId) {
            return Response.json({ success: true, ignored: true });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const viewerIp = req.headers.get('x-forwarded-for') || 'unknown';

        // Insert view record. The SQL trigger handles throttling and Inbox insertion.
        const { error } = await supabase.from('directory_views').insert({
            profile_id: profileId,
            viewer_id: viewerId || null,
            viewer_ip: viewerId ? null : viewerIp
        });

        // We ignore unique constraint errors gracefully since they represent our throttling rule
        if (error && error.code !== '23505') {
            console.error('Failed to log directory view:', error);
            // Don't fail the request for telemetry failures
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('Directory view API error:', err);
        return Response.json({ success: false }, { status: 500 });
    }
}
