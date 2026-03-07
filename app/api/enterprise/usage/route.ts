export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getUsageDashboard } from '@/lib/enterprise/usage-metering';

/**
 * GET /api/enterprise/usage — Customer usage dashboard data
 *
 * Returns:
 *   - Current quota status (plan, used, remaining, percentage)
 *   - Daily usage rollups for the last 30 days
 *   - API key inventory with status and last-used timestamps
 *   - Unresolved anomaly alerts
 */
export async function GET() {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const dashboard = await getUsageDashboard(user.id);

    return NextResponse.json({
        ...dashboard,
        meta: {
            customer_id: user.id,
            generated_at: new Date().toISOString(),
        },
    });
}
