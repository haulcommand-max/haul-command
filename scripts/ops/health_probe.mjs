/**
 * Health Probe — external SLO checker for production.
 *
 * Usage: node scripts/ops/health_probe.mjs
 *
 * Env: PROD_BASE_URL (default: https://haulcommand.com)
 */

import { notify } from './notify.mjs';

const BASE_URL = process.env.PROD_BASE_URL || 'https://haulcommand.com';
const TIMEOUT_MS = 10000;
const MAX_LATENCY_MS = 1500;

async function probe(path) {
    const url = `${BASE_URL}${path}`;
    const start = Date.now();

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'HaulCommand-HealthProbe/1.0' },
        });

        clearTimeout(timer);
        const latency = Date.now() - start;

        if (!res.ok) {
            return { url, status: res.status, latency, ok: false, error: `HTTP ${res.status}` };
        }

        const body = await res.json().catch(() => null);
        return {
            url,
            status: res.status,
            latency,
            ok: latency <= MAX_LATENCY_MS,
            slow: latency > MAX_LATENCY_MS,
            body,
        };
    } catch (err) {
        return { url, status: 0, latency: Date.now() - start, ok: false, error: err.message };
    }
}

async function main() {
    console.log(`[health_probe] Probing ${BASE_URL}...`);

    const results = await Promise.all([
        probe('/api/health'),
    ]);

    let allOk = true;
    const details = [];

    for (const r of results) {
        const icon = r.ok ? '✅' : r.slow ? '⚠️' : '❌';
        const line = `${icon} ${r.url} → ${r.status} (${r.latency}ms)${r.error ? ` [${r.error}]` : ''}`;
        details.push(line);
        console.log(line);

        if (!r.ok) allOk = false;
    }

    if (!allOk) {
        await notify({
            status: 'fail',
            title: 'Health Probe Failed',
            details: details.join('\n'),
            url: BASE_URL,
            fields: {
                'Endpoint': BASE_URL,
                'Max Latency': `${MAX_LATENCY_MS}ms`,
            },
        });
        process.exit(1);
    }

    console.log('[health_probe] All probes passed ✅');
}

main().catch(err => {
    console.error('[health_probe] Fatal:', err);
    process.exit(1);
});
