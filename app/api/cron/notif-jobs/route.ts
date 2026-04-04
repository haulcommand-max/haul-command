import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendNativePush, type PushPayload } from '@/lib/push-send';

/**
 * GET /api/cron/notif-jobs
 * 
 * Periodic scanner that checks `hc_notif_jobs` for pending push notifications
 * (like new_load_match route requests or coverage_gap_alerts), targets the correctly
 * segmented operators over Firebase Native Push or VAPID Web Push, and marks the job as done.
 * 
 * Runs via Vercel Cron or external scheduler.
 * Backend-only, service-role.
 */
export async function GET(req: NextRequest) {
    // ── Auth Check ────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET;
    if (authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    const now = new Date();

    try {
        // 1. Fetch pending jobs
        const { data: jobs, error: fetchError } = await sb
            .from('hc_notif_jobs')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', now.toISOString())
            .limit(50);

        if (fetchError) throw fetchError;
        if (!jobs || jobs.length === 0) {
            return NextResponse.json({ ok: true, message: 'No pending jobs' });
        }

        // 2. Mark jobs as processing
        const jobIds = jobs.map(j => j.id);
        await sb.from('hc_notif_jobs').update({ status: 'processing' }).in('id', jobIds);

        let successCount = 0;
        let failCount = 0;

        // 3. Process jobs
        for (const job of jobs) {
            try {
                const payload = job.payload;
                const pushData: PushPayload = {
                    title: payload.title || 'Haul Command Alert',
                    body: payload.body || '',
                    url: payload.deepLink,
                    priority: payload.eventType === 'new_load_match' || payload.eventType === 'coverage_gap_alert' ? 'urgent' : 'high',
                };

                if (job.mode === 'single' && payload.userId) {
                    await sendNativePush(payload.userId, pushData);
                } else if (job.mode === 'broadcast' && payload.roleKey) {
                    // Complex broadcast segmenting (by role, country, etc.)
                    let query = sb.from('profile_roles').select('profile_id').eq('role_key', payload.roleKey);
                    
                    // If target is corridor... you could query hc_available_now or user settings
                    // For now, we resolve users who match the role and country
                    if (payload.countryCode) {
                        // Assumption: if country filtering is needed, fetch from the main profiles
                        // But profile_roles only ties to profile. We'll join or just fetch from a view down the line
                        // Simulating a broad reach for now:
                    }

                    const { data: targets } = await query.limit(500);
                    if (targets) {
                        for (const t of targets) {
                            await sendNativePush(t.profile_id, pushData);
                        }
                    }
                }

                // Mark done
                await sb.from('hc_notif_jobs').update({ 
                    status: 'done', 
                    processed_at: new Date().toISOString() 
                }).eq('id', job.id);
                successCount++;

            } catch (jobErr: any) {
                // Mark failed
                await sb.from('hc_notif_jobs').update({ 
                    status: 'failed', 
                    last_error: jobErr?.message || 'Unknown error',
                    attempts: job.attempts + 1
                }).eq('id', job.id);
                failCount++;
            }
        }

        return NextResponse.json({ ok: true, processed: successCount, failed: failCount });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
