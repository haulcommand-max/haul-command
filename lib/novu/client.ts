/**
 * Novu Client — Singleton
 * 
 * Backend-only. Uses service-role patterns.
 * Never import this from client components.
 * 
 * Uses @novu/node (has .events.trigger() API).
 * 
 * @status wired_not_live — client ready, API key pending
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _novu: any = null;
let _isDryRun = false;
let _initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getNovuClient(): Promise<any> {
    if (!_initialized) {
        _initialized = true;
        const apiKey = process.env.NOVU_API_KEY;
        if (!apiKey) {
            console.warn('[NOVU] API key not set — notifications will be logged but not sent');
            _isDryRun = true;
            _novu = null;
        } else {
            _isDryRun = false;
            try {
                const mod = await import('@novu/node');
                _novu = new mod.Novu(apiKey);
            } catch (e) {
                console.warn('[NOVU] Failed to initialize client:', e);
                _isDryRun = true;
                _novu = null;
            }
        }
    }
    return _novu;
}

/**
 * Check if Novu is in dry-run mode (no API key)
 */
export function isNovuDryRun(): boolean {
    return _isDryRun || !process.env.NOVU_API_KEY;
}
