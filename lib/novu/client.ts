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
import { Novu } from '@novu/node';

let _novu: Novu | null = null;
let _isDryRun = false;

export function getNovuClient(): Novu {
    if (!_novu) {
        const apiKey = process.env.NOVU_API_KEY;
        if (!apiKey) {
            console.warn('[NOVU] API key not set — notifications will be logged but not sent');
            _isDryRun = true;
            // Create with dummy key — the emitter checks isDryRun before calling
            _novu = new Novu('dry_run_placeholder');
        } else {
            _isDryRun = false;
            _novu = new Novu(apiKey);
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
