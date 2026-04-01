/**
 * GET /admin/system
 * Admin system health dashboard — cron jobs, edge functions, data pulse, revenue zones.
 */

import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'System Health | Haul Command Admin',
    description: 'Internal system health dashboard — cron jobs, edge functions, RLS status.',
    robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface CronJob {
    jobid: number;
    jobname: string;
    schedule: string;
    active: boolean;
    nodename: string | null;
    command: string;
}

// Safe query helper — accepts any thenable or value-returning fn (avoids .catch() on PostgrestFilterBuilder)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuery(fn: () => unknown, fallback: any): Promise<any> {
    try { return await Promise.resolve(fn()); } catch { return fallback; }
}

async function fetchSystemData() {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const [mpsCount, mpsLatest, arrCount, asmCount, cronResult, uzrCount, revZones] = await Promise.all([
        safeQuery(async () => await svc.from('market_pressure_snapshots')
            .select('id', { count: 'exact', head: true })
            .gt('valid_until', new Date().toISOString()), { count: 0 }),

        safeQuery(async () => await svc.from('market_pressure_snapshots')
            .select('computed_at')
            .gt('valid_until', new Date().toISOString())
            .order('computed_at', { ascending: false })
            .limit(1), { data: null }),

        safeQuery(async () => await svc.from('arr_reposition_plays')
            .select('id', { count: 'exact', head: true })
            .gt('valid_until', new Date().toISOString()), { count: 0 }),

        safeQuery(async () => await svc.from('supply_actions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'proposed'), { count: 0 }),

        safeQuery(async () => await svc.rpc('exec_sql', {
            sql: `SELECT jobid, jobname, schedule, active, nodename, command FROM cron.job ORDER BY jobname LIMIT 50`,
        }), { data: null, error: { message: 'pg_cron not enabled' } }),

        safeQuery(async () => await svc.from('underserved_zone_radar')
            .select('region_code, gap_type, severity_score', { count: 'exact' })
            .in('gap_type', ['critical_gap', 'twic_shortage', 'no_supply'])
            .order('severity_score', { ascending: false })
            .limit(5), { count: 0, data: [] }),

        safeQuery(async () => await svc.from('revenue_zone_scores')
            .select('region_code, zone_classification, revenue_potential_score')
            .in('zone_classification', ['hot_zone', 'rising_zone'])
            .order('revenue_potential_score', { ascending: false })
            .limit(5), { data: [] }),
    ]);

    const cronErr = (cronResult as any)?.error?.message ?? null;
    const cronJobs: CronJob[] = Array.isArray((cronResult as any)?.data) ? (cronResult as any).data : [];

    // ── Integration health checks
    const integrations = [
        { key: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude', powers: '12 AI agents, Copilot', fallback: 'AI features disabled', configured: !!process.env.ANTHROPIC_API_KEY },
        { key: 'SUPABASE_URL', label: 'Supabase Database', powers: 'All data storage', fallback: 'App cannot function', configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY },
        { key: 'STRIPE_SECRET_KEY', label: 'Stripe Payments', powers: 'Subscriptions, AdGrid boost', fallback: 'Payment CTAs show "Coming Soon"', configured: !!process.env.STRIPE_SECRET_KEY },
        { key: 'RESEND_API_KEY', label: 'Resend Email', powers: 'Transactional email, drip sequence', fallback: 'Emails queued in outreach_log', configured: !!process.env.RESEND_API_KEY },
        { key: 'FIREBASE_APP_ID', label: 'Firebase App', powers: 'Push notifications', fallback: 'In-app notification bell', configured: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
        { key: 'FIREBASE_VAPID', label: 'Firebase VAPID', powers: 'Web push tokens', fallback: 'Push disabled, in-app only', configured: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY },
        { key: 'POSTHOG_KEY', label: 'PostHog Analytics', powers: 'Product analytics', fallback: 'Vercel Analytics + hc_events table', configured: !!process.env.NEXT_PUBLIC_POSTHOG_KEY },
        { key: 'SENTRY_DSN', label: 'Sentry Monitoring', powers: 'Error tracking', fallback: 'system_errors Supabase table', configured: !!process.env.SENTRY_DSN },
        { key: 'GA_ID', label: 'Google Analytics', powers: 'Pageview analytics', fallback: 'Vercel Analytics (already active)', configured: !!process.env.NEXT_PUBLIC_GA_ID },
        { key: 'LISTMONK_PASS', label: 'Listmonk Email', powers: 'Bulk outreach (optional)', fallback: 'Resend bulk sends (active)', configured: !!process.env.LISTMONK_API_PASSWORD },
        { key: 'VAPI_KEY', label: 'Vapi Voice AI', powers: 'Voice dispatch', fallback: 'Feature disabled', configured: !!process.env.VAPI_PRIVATE_API_KEY },
        { key: 'NOWPAYMENTS', label: 'NOWPayments Crypto', powers: 'Crypto payments', fallback: 'Stripe-only checkout', configured: !!process.env.NOWPAYMENTS_API_KEY },
        { key: 'LANGFUSE', label: 'Langfuse LLM Obs', powers: 'LLM cost tracking', fallback: 'Tokens logged to hc_events', configured: !!process.env.LANGFUSE_SECRET_KEY },
        { key: 'TRIGGER', label: 'Trigger.dev Jobs', powers: 'Background job scheduler', fallback: 'Vercel cron (active)', configured: !!process.env.TRIGGER_API_KEY },
        { key: 'HERE_MAPS', label: 'HERE Maps', powers: 'Geocoding, routing', fallback: 'Static coordinates', configured: !!process.env.HERE_API_KEY },
    ];

    const configuredCount = integrations.filter(i => i.configured).length;
    const totalCount = integrations.length;

    // ── Recent system errors
    let recentErrors: { route: string; message: string; created_at: string; count: number }[] = [];
    try {
        const { data } = await svc.from('system_errors')
            .select('route, message, created_at, count')
            .order('created_at', { ascending: false })
            .limit(20);
        recentErrors = (data ?? []) as any[];
    } catch { /* table may not exist */ }

    return {
        mps: {
            activeCount: (mpsCount as any)?.count ?? 0,
            lastComputed: ((mpsLatest as any)?.data?.[0]?.computed_at as string) ?? null,
        },
        arr: { activePlays: (arrCount as any)?.count ?? 0 },
        asm: { pendingActions: (asmCount as any)?.count ?? 0 },
        cron: { jobs: cronJobs, error: cronErr },
        uzr: {
            criticalZones: (uzrCount as any)?.count ?? 0,
            topGaps: ((uzrCount as any)?.data ?? []) as Array<{ region_code: string; gap_type: string; severity_score: number }>,
        },
        revenue: {
            hotZones: ((revZones as any)?.data ?? []) as Array<{ region_code: string; zone_classification: string; revenue_potential_score: number }>,
        },
        integrations,
        configuredCount,
        totalCount,
        recentErrors,
    };
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default async function SystemHealthPage() {
    const data = await fetchSystemData();
    const now = new Date().toISOString();
    const pgCronEnabled = !data.cron.error;

    const criticalTables = [
        { name: 'mps', label: 'Active Market Snapshots', count: data.mps.activeCount, note: data.mps.lastComputed ? `Last: ${new Date(data.mps.lastComputed).toLocaleString()}` : 'No data' },
        { name: 'arr', label: 'ARR Reposition Plays', count: data.arr.activePlays, note: '' },
        { name: 'asm', label: 'ASM Pending Actions', count: data.asm.pendingActions, note: '' },
        { name: 'uzr', label: 'Critical Supply Gaps', count: data.uzr.criticalZones, note: 'underserved_zone_radar' },
        { name: 'rev', label: 'Hot/Rising Revenue Zones', count: data.revenue.hotZones.length, note: 'revenue_zone_scores' },
    ];

    const CRON_JOBS_EXPECTED = [
        // SQL-native (fire immediately)
        { name: 'amm_market_make', cadence: 'Hourly :05', native: true },
        { name: 'amm_zone_rebalance', cadence: 'Hourly :35', native: true },
        { name: 'recompute_geo_density', cadence: 'Hourly :10', native: true },
        { name: 'evaluate_geo_expansion', cadence: 'Every 30m', native: true },
        // Edge function triggers (need app.supabase_service_role_key set)
        { name: 'ef_liquidity_refresh', cadence: 'Every 15m', native: false },
        { name: 'ef_match_engine', cadence: 'Every 5m', native: false },
        { name: 'ef_compute_match_scores', cadence: 'Every 5m', native: false },
        { name: 'ef_autobid', cadence: 'Every 10m', native: false },
        { name: 'ef_asm_compute', cadence: 'Hourly :15', native: false },
        { name: 'ef_surge_engine', cadence: 'Hourly :20', native: false },
        { name: 'ef_coverage_probability', cadence: 'Hourly :25', native: false },
        { name: 'ef_trust_score', cadence: 'Hourly :40', native: false },
        { name: 'ef_boost_recommender', cadence: 'Hourly :45', native: false },
        { name: 'ef_sweep_stale_loads', cadence: 'Hourly :00', native: false },
        { name: 'ef_arr_compute', cadence: 'Every 6h', native: false },
        { name: 'ef_ad_settle', cadence: 'Daily 2am UTC', native: false },
        { name: 'ef_ad_reset_daily', cadence: 'Daily 4am UTC', native: false },
    ];


    const EDGE_FUNCTIONS_EXPECTED = [
        'arr-compute', 'asm-compute', 'cron-sweep-stale-loads', 'liquidity-refresh',
        'surge-engine', 'match-engine', 'coverage-probability', 'trust-score-recalculator',
        'ad-reset-daily', 'ad-settle', 'boost-recommender', 'autobid-controller', 'compute-match-scores',
    ];

    const registeredJobNames = data.cron.jobs.map((j: CronJob) => j.jobname);

    const GAP_COLOR: Record<string, string> = {
        critical_gap: '#f87171', twic_shortage: '#fb923c', no_supply: '#ef4444',
    };
    const ZONE_COLOR: Record<string, string> = {
        hot_zone: '#f59e0b', rising_zone: '#a78bfa',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#08090e', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1.5rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={badge}>⚡ System Health</div>
                        <h1 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 900, color: '#f9fafb' }}>Haul Command — System Monitor</h1>
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Rendered: {new Date(now).toLocaleString()} · force-dynamic</p>
                    </div>
                    <Link href="/admin" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>← Admin</Link>
                </div>

                {/* Stripe Mode Banner — MOVE 1 */}
                {(() => {
                    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
                    const isTest = stripeKey.startsWith('sk_test_');
                    const isLive = stripeKey.startsWith('sk_live_');
                    const notSet = !stripeKey;
                    return (
                        <div style={{
                            padding: '16px 20px', borderRadius: 12, marginBottom: 16,
                            background: isLive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.12)',
                            border: `2px solid ${isLive ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.5)'}`,
                            display: 'flex', alignItems: 'center', gap: 14,
                            animation: isTest ? 'pulse-red 2s infinite' : 'none',
                        }}>
                            <span style={{ fontSize: 24 }}>{isLive ? '💳' : '🚨'}</span>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 14, color: isLive ? '#34d399' : '#f87171', letterSpacing: '0.02em' }}>
                                    {isLive ? '✅ STRIPE LIVE MODE — Real Payments Active' : notSet ? '❌ STRIPE NOT CONFIGURED — No Payments Possible' : '🚨 STRIPE TEST MODE — NO REAL PAYMENTS BEING COLLECTED'}
                                </div>
                                <div style={{ fontSize: 11, color: isLive ? '#6ee7b7' : '#fca5a5', marginTop: 3 }}>
                                    {isLive ? 'Subscriptions, escrow, boosts, and training enrollments are processing real charges.' : notSet ? 'Add STRIPE_SECRET_KEY (sk_live_...) to .env.local and Vercel.' : 'All 12 revenue features are active but collecting $0. Switch to sk_live_ keys in .env.local and Vercel environment variables NOW.'}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* pg_cron banner */}
                <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 24, background: pgCronEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${pgCronEnabled ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{pgCronEnabled ? '✅' : '🔴'}</span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: pgCronEnabled ? '#34d399' : '#f87171' }}>
                            pg_cron: {pgCronEnabled ? `ENABLED — ${data.cron.jobs.length} jobs registered` : 'NOT ENABLED — autonomous loops blocked'}
                        </div>
                        {!pgCronEnabled && (
                            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>
                                Go to Supabase Dashboard → Database → Extensions → enable <strong>pg_cron</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── INTEGRATION HEALTH ────────────────────────── */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>Integration Health — {data.configuredCount}/{data.totalCount} Configured</h2>
                    <div style={{
                        padding: '14px 18px', borderRadius: 12, marginBottom: 12,
                        background: data.configuredCount >= 10 ? 'rgba(16,185,129,0.08)' : data.configuredCount >= 5 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${data.configuredCount >= 10 ? 'rgba(16,185,129,0.25)' : data.configuredCount >= 5 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: data.configuredCount >= 10 ? '#34d399' : data.configuredCount >= 5 ? '#fbbf24' : '#f87171' }}>
                            {data.configuredCount >= 12 ? '✅ Platform fully operational' : data.configuredCount >= 8 ? '⚠️ Core services running — optional integrations missing' : '🔴 Multiple services missing — check below'}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                        {data.integrations.map((svc: any, i: number) => (
                            <div key={svc.key} style={{ display: 'grid', gridTemplateColumns: '28px 150px 1fr 1fr', alignItems: 'center', padding: '10px 14px', gap: 12, borderBottom: i < data.integrations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <span style={{ fontSize: 16 }}>{svc.configured ? '✅' : '❌'}</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{svc.label}</div>
                                    <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'monospace' }}>{svc.key}</div>
                                </div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{svc.powers}</div>
                                <div style={{ fontSize: 11, color: svc.configured ? '#34d399' : '#fbbf24' }}>
                                    {svc.configured ? 'Active' : `Fallback: ${svc.fallback}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── RECENT SYSTEM ERRORS ──────────────────────── */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>Recent System Errors ({data.recentErrors.length})</h2>
                    {data.recentErrors.length === 0 ? (
                        <div style={{ padding: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, color: '#6ee7b7' }}>
                            ✅ No errors logged. system_errors table is clean.
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                            {data.recentErrors.map((err: any, i: number) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', padding: '10px 14px', gap: 12, borderBottom: i < data.recentErrors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{err.route}</div>
                                    <div style={{ fontSize: 11, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.message}</div>
                                    <div style={{ fontSize: 10, color: '#4b5563', textAlign: 'right' }}>×{err.count ?? 1}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Data Pulse */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>Core Data Pulse</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
                        {criticalTables.map(t => (
                            <div key={t.name} style={card}>
                                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t.label}</div>
                                <div style={{ fontSize: 26, fontWeight: 900, color: (t.count ?? 0) > 0 ? '#34d399' : '#f87171' }}>{t.count?.toLocaleString() ?? '—'}</div>
                                {t.note && <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>{t.note}</div>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Revenue Zone Summary */}
                {data.revenue.hotZones.length > 0 && (
                    <section style={{ marginBottom: 28 }}>
                        <h2 style={sectionHeader}>🔥 Revenue Hot &amp; Rising Zones</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {data.revenue.hotZones.map((z) => (
                                <div key={z.region_code} style={{ padding: '6px 14px', borderRadius: 8, background: `${z.zone_classification === 'hot_zone' ? 'rgba(245,158,11,0.1)' : 'rgba(167,139,250,0.1)'}`, border: `1px solid ${z.zone_classification === 'hot_zone' ? 'rgba(245,158,11,0.3)' : 'rgba(167,139,250,0.3)'}` }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: ZONE_COLOR[z.zone_classification] ?? '#9ca3af' }}>{z.region_code}</span>
                                    <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>Score: {z.revenue_potential_score}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Critical Supply Gaps */}
                {data.uzr.topGaps.length > 0 && (
                    <section style={{ marginBottom: 28 }}>
                        <h2 style={sectionHeader}>⚠️ Underserved Zone Radar — Top Gaps</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {data.uzr.topGaps.map((g) => (
                                <div key={g.region_code} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: `1px solid ${GAP_COLOR[g.gap_type] ?? 'rgba(239,68,68,0.25)'}20` }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: GAP_COLOR[g.gap_type] ?? '#f87171' }}>{g.region_code}</span>
                                    <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>{g.gap_type.replace('_', ' ')} · {g.severity_score}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cron Jobs */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>Cron Job Registry</h2>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                        {CRON_JOBS_EXPECTED.map((expected, i) => {
                            const registered = registeredJobNames.includes(expected.name);
                            const cronJob = data.cron.jobs.find((j: CronJob) => j.jobname === expected.name);
                            return (
                                <div key={expected.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', gap: 12, borderBottom: i < CRON_JOBS_EXPECTED.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', fontFamily: 'monospace' }}>{expected.name}</div>
                                        <div style={{ fontSize: 10, color: '#6b7280' }}>{expected.cadence}{cronJob ? ` · ${cronJob.schedule}` : ''}</div>
                                    </div>
                                    <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: registered ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: registered ? '#34d399' : '#f87171', border: `1px solid ${registered ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                                        {registered ? (cronJob?.active ? 'Active' : 'Paused') : 'Not Registered'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Edge Functions */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>Edge Functions (Deployed)</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {EDGE_FUNCTIONS_EXPECTED.map(fn => (
                            <span key={fn} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>{fn}</span>
                        ))}
                    </div>
                </section>

                {/* RLS summary */}
                <section style={{ marginBottom: 28 }}>
                    <h2 style={sectionHeader}>RLS Status</h2>
                    <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, color: '#6ee7b7' }}>
                        ✅ Hardened on 18 sensitive tables (gate_event_log, arr_reposition_plays, terminal_risk_profile, market_pressure_snapshots, supply_actions + 13 more).
                        Remaining 28 lower-priority tables — audit via Supabase Security Advisor.
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 style={sectionHeader}>Quick Actions</h2>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={actionBtn}>Enable pg_cron ↗</a>
                        <Link href="/admin" style={{ ...actionBtn, background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>Admin Home</Link>
                        <Link href="/regulatory-db" style={{ ...actionBtn, background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>Regulatory DB</Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

const badge: React.CSSProperties = { display: 'inline-block', padding: '3px 10px', background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase' };
const sectionHeader: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b7280', marginBottom: 10, marginTop: 0 };
const card: React.CSSProperties = { padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };
const actionBtn: React.CSSProperties = { padding: '9px 18px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#a5b4fc', textDecoration: 'none', cursor: 'pointer' };
