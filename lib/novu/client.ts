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

let _novu: unknown | null = null;
let _isDryRun = false;
let _initialized = false;

export function getNovuClient(): unknown {
    if (!_initialized) {
        _initialized = true;
        const apiKey = process.env.NOVU_API_KEY;
        if (!apiKey) {
            console.warn('[NOVU] API key not set — notifications will be logged but not sent');
            _isDryRun = true;
            _novu = null;
        } else {
            _isDryRun = false;
            // Dynamic import at runtime to avoid build-time validation errors
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { Novu } = require('@novu/node');
                _novu = new Novu(apiKey);
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
