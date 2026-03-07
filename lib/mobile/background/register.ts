/**
 * Haul Command — Background Runner Registration
 *
 * Registers the periodic background location ping task with Capacitor.
 * iOS may throttle aggressively; interval is best-effort.
 */

import { BackgroundRunner } from '@capacitor/background-runner';
import { pingLocationNow } from './locationRunner';

export async function registerBackgroundLocationTask(params: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    getAccessToken: () => Promise<string | null>;
    intervalSeconds?: number;
    deviceId?: string;
    sessionId?: string;
}) {
    const interval = params.intervalSeconds ?? 60;

    try {
        // Register the background task
        // @ts-expect-error — BackgroundRunner API may vary across versions
        await BackgroundRunner.register({
            taskId: 'hc_location_ping_v1',
            interval,
        });

        // Listen for the background run event
        // @ts-expect-error — BackgroundRunner listener API
        BackgroundRunner.addListener('run', async (event: { taskId: string }) => {
            if (event?.taskId !== 'hc_location_ping_v1') return;

            const token = await params.getAccessToken();
            if (!token) return;

            try {
                await pingLocationNow({
                    supabaseUrl: params.supabaseUrl,
                    supabaseAnonKey: params.supabaseAnonKey,
                    accessToken: token,
                    deviceId: params.deviceId,
                    sessionId: params.sessionId,
                });
            } catch {
                // If offline: the foreground outbox queue handles retry.
                // Background failures are silent by design.
            }
        });

        console.log(`[hc-bg] Background location task registered (interval: ${interval}s)`);
    } catch (err) {
        console.warn('[hc-bg] Failed to register background task:', err);
    }
}

export async function unregisterBackgroundLocationTask() {
    try {
        // @ts-expect-error — BackgroundRunner API
        await BackgroundRunner.unregister({ taskId: 'hc_location_ping_v1' });
    } catch {
        // Swallow — task may not be registered
    }
}
