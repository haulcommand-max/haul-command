export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/email/preferences — Return current user's email preferences
 * PATCH /api/email/preferences — Update email preferences
 */

export async function GET(req: Request) {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: prefs, error } = await supabase
            .from('email_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // No row exists yet — return defaults
            return NextResponse.json({
                user_id: user.id,
                newsletter_opt_in: true,
                product_updates: true,
                viewed_you: true,
                claim_reminders: true,
                leaderboard_alerts: false,
                corridor_risk_pulse: false,
                digest_frequency: 'monthly',
                quiet_hours_start: '21:00:00',
                quiet_hours_end: '07:00:00',
            });
        }

        return NextResponse.json(prefs);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        // Whitelist allowed fields
        const allowed = [
            'newsletter_opt_in', 'product_updates', 'viewed_you',
            'claim_reminders', 'leaderboard_alerts', 'corridor_risk_pulse',
            'digest_frequency', 'quiet_hours_start', 'quiet_hours_end'
        ];

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        const { data, error } = await supabase
            .from('email_preferences')
            .upsert({ user_id: user.id, ...updates })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
