/**
 * POST /api/operator/profile-event
 *
 * Unified trigger handler for profile completion lifecycle events:
 *   - profile_claimed: first-time claim → compute score, show strength meter, offer app download
 *   - field_updated: profile field changed → recompute, check milestones, grant boosts
 *   - broker_view: broker viewed profile → nudge if < 80%
 *
 * Body: { event: string, userId?: string, field?: string, viewerId?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProfileCompletionEngine } from '@/core/engagement/profile_completion_engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, userId: bodyUserId, field, viewerId } = body;

        if (!event) return NextResponse.json({ error: 'event required' }, { status: 400 });

        // Auth: either authenticated user or service key
        let userId = bodyUserId;
        const authHeader = req.headers.get('authorization');
        const isService = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

        if (!isService) {
            const cookieStore = await cookies();
            const supabaseUser = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { cookies: { getAll: () => cookieStore.getAll() } }
            );
            const { data: { user } } = await supabaseUser.auth.getUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            userId = user.id;
        }

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const engine = new ProfileCompletionEngine(admin);

        switch (event) {
            case 'profile_claimed': {
                const result = await engine.onProfileClaimed(userId);
                return NextResponse.json({
                    event: 'profile_claimed',
                    completion: result.completion,
                    toast: result.toast,
                    nudge: result.nudge,
                });
            }

            case 'field_updated': {
                if (!field) return NextResponse.json({ error: 'field required for field_updated' }, { status: 400 });
                const result = await engine.onProfileFieldUpdated(userId, field);
                return NextResponse.json({
                    event: 'field_updated',
                    completion: result.completion,
                    visibility: result.visibility,
                    toast: result.toast,
                });
            }

            case 'broker_view': {
                const nudge = await engine.onBrokerProfileView(userId, viewerId ?? null);
                return NextResponse.json({
                    event: 'broker_view',
                    nudge_sent: nudge !== null,
                    nudge,
                });
            }

            default:
                return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 });
    }
}
