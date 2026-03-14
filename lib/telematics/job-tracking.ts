// lib/telematics/job-tracking.ts
// Wire Traccar tracking sessions to booking jobs
// ============================================================

import { isEnabled } from '@/lib/feature-flags';
import { registerDevice, getDevice, getPositionHistory, type TelemPosition } from '@/lib/telematics/traccar';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

/**
 * Activate tracking for a job.
 * Ensures each escort operator has a Traccar device, records session IDs.
 */
export async function activateJobTracking(
    jobId: string,
    escortIds: string[]
): Promise<{ activated: boolean; deviceIds: string[]; error?: string }> {
    if (!isEnabled('TRACCAR')) {
        return { activated: false, deviceIds: [], error: 'Traccar not enabled' };
    }

    const supabase = getSupabaseAdmin();
    const deviceIds: string[] = [];

    try {
        for (const operatorId of escortIds) {
            // Check if operator already has a device
            let device = await getDevice(operatorId);

            if (!device) {
                // Register a new device for this operator
                device = await registerDevice(
                    `operator-${operatorId.slice(0, 8)}`,
                    operatorId,
                    { operator_id: operatorId, job_id: jobId }
                );
            }

            if (device) {
                deviceIds.push(device.id);
            }
        }

        // Store session info on the job
        await supabase
            .from('jobs')
            .update({
                traccar_session_ids: deviceIds.map(id => ({
                    device_id: id,
                    started_at: new Date().toISOString(),
                    job_id: jobId,
                })),
            })
            .eq('job_id', jobId);

        console.log(`[Tracking] Activated for job ${jobId}: ${deviceIds.length} devices`);
        return { activated: true, deviceIds };
    } catch (err: any) {
        console.error(`[Tracking] Activation failed for job ${jobId}:`, err.message);
        return { activated: false, deviceIds, error: err.message };
    }
}

/**
 * Get live positions for all escorts on a job.
 */
export async function getJobLivePositions(jobId: string): Promise<TelemPosition[]> {
    if (!isEnabled('TRACCAR')) return [];

    const supabase = getSupabaseAdmin();
    const { data: job } = await supabase
        .from('jobs')
        .select('traccar_session_ids, assigned_escort_ids')
        .eq('job_id', jobId)
        .single();

    if (!job) return [];

    const sessions = (job as any).traccar_session_ids ?? [];
    const positions: TelemPosition[] = [];

    for (const session of sessions) {
        const device = await getDevice(session.device_id);
        if (device?.position) {
            positions.push(device.position);
        }
    }

    return positions;
}

/**
 * Get the complete route history for a completed job (evidence collection).
 */
export async function getJobRouteHistory(
    jobId: string,
    from: Date,
    to: Date
): Promise<Record<string, TelemPosition[]>> {
    if (!isEnabled('TRACCAR')) return {};

    const supabase = getSupabaseAdmin();
    const { data: job } = await supabase
        .from('jobs')
        .select('traccar_session_ids')
        .eq('job_id', jobId)
        .single();

    if (!job) return {};

    const sessions = (job as any).traccar_session_ids ?? [];
    const history: Record<string, TelemPosition[]> = {};

    for (const session of sessions) {
        history[session.device_id] = await getPositionHistory(session.device_id, from, to);
    }

    return history;
}

/**
 * Deactivate tracking after job completion.
 */
export async function deactivateJobTracking(jobId: string): Promise<void> {
    if (!isEnabled('TRACCAR')) return;

    const supabase = getSupabaseAdmin();
    const { data: job } = await supabase
        .from('jobs')
        .select('traccar_session_ids')
        .eq('job_id', jobId)
        .single();

    if (!job) return;

    // Mark sessions as ended
    const sessions = ((job as any).traccar_session_ids ?? []).map((s: any) => ({
        ...s,
        ended_at: new Date().toISOString(),
    }));

    await supabase
        .from('jobs')
        .update({ traccar_session_ids: sessions })
        .eq('job_id', jobId);

    console.log(`[Tracking] Deactivated for job ${jobId}`);
}
