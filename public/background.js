/**
 * Capacitor BackgroundRunner script.
 * Runs in a headless JS context (no DOM, no window).
 *
 * Registered event: "heartbeat" (interval: 60s)
 * - Reports operator GPS position for escort availability
 * - Syncs offline outbox (evidence, job updates) when online
 */

addEventListener('heartbeat', async (resolve, reject, args) => {
    try {
        const { CapacitorGeolocation, CapacitorNotifications, CapacitorKV } = args;

        // 1. Read persisted auth token
        const token = await CapacitorKV.get('auth_token');
        if (!token) {
            resolve();
            return;
        }

        // 2. Get current position (coarse is sufficient for heartbeat)
        let position = null;
        try {
            position = await CapacitorGeolocation.getCurrentPosition();
        } catch (e) {
            // Location permission not granted or unavailable — skip this tick
        }

        // 3. Send heartbeat to server
        if (position) {
            try {
                const res = await fetch('https://haulcommand.com/api/presence/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        ts: Date.now(),
                    }),
                });

                if (!res.ok && res.status === 401) {
                    // Token expired — stop heartbeat until next login
                    await CapacitorKV.set('auth_token', '');
                }
            } catch (e) {
                // Network unavailable — will retry on next interval
            }
        }

        resolve();
    } catch (e) {
        reject(e);
    }
});
