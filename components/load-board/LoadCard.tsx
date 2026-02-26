import * as React from 'react';
import { UnlockButton } from './UnlockButton';
import {
    MapPin, Clock, DollarSign, ShieldCheck, Zap,
    AlertTriangle, Users, Timer, Banknote, AlertCircle,
    CheckCircle2, Lock, Truck, Flag, Star
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ══════════════════════════════════════════════════════════════
// LoadCard v4 — Haul Command
//
// Changes from v3:
//   • Job lifecycle status banner (open/pending_hold/booked/in_progress/completed)
//   • Jobs NEVER vanish — booked cards muted with Covered badge
//   • Pay-first layout: rate promoted to top-left
//   • Deadhead miles + net estimate below rate
//   • Broker trust signals: "Paid on platform", "Deposit funded", dispute flag
//   • All HC tokens — zero slate-*, zero hardcoded hex
// ══════════════════════════════════════════════════════════════

export type LoadStatus =
    | 'open'
    | 'pending_hold'
    | 'booked'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export type LoadCardModel = {
    id: string;
    origin: { city: string; admin1: string; country: string };
    destination: { city: string; admin1: string; country: string };
    service_required: string;
    posted_at: string;

    // Lifecycle
    status?: LoadStatus;
    booked_at?: string | null;           // ISO — "filled 4m ago"
    pending_hold_expires_at?: string | null;

    // Rate
    rate_amount?: number | null;
    rate_currency?: string | null;
    rate_min?: number | null;
    rate_max?: number | null;

    // Pay intelligence
    deadhead_miles?: number | null;      // distance to load origin from escort home base
    net_after_fees_estimate?: number | null;

    // Intelligence (computed server-side)
    load_quality_grade?: 'A' | 'B' | 'C' | 'D' | null;
    fill_speed_label?: string | null;
    fill_speed_bucket?: 'fast' | 'normal' | 'slow' | null;
    explain_top_3?: string[] | null;
    fill_probability_01?: number | null;
    lane_badges?: string[] | null;

    broker?: {
        name: string;
        verification?: string;
        trust_score?: number;
        avg_days_to_pay?: number;
        platform_payment_count?: number; // how many times paid via platform
        deposit_funded?: boolean;         // escrow deposit is live
        has_open_dispute?: boolean;       // active payment dispute
    } | null;

    // Fill enrichment
    estimated_fill_time_min?: number | null;
    nearby_available_count?: number | null;

    // Route intelligence
    route_crosses_curfew_state?: boolean;
    curfew_state_codes?: string[];

    // Escort Job Score (market pressure engine)
    escort_job_score?: number | null;
    rate_signal?: 'strong' | 'fair' | 'under_market' | null;
    rate_trend?: 'up' | 'down' | 'stable' | null;

    // Gating
    contact_locked?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────

function minutesAgo(iso: string): string {
    const ms = Date.now() - Date.parse(iso);
    const m = Math.max(0, Math.floor(ms / 60000));
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function secondsUntil(iso: string): number {
    return Math.max(0, Math.floor((Date.parse(iso) - Date.now()) / 1000));
}

function formatLocation(loc: { city: string; admin1: string; country: string }) {
    return `${loc.city}, ${loc.admin1}`;
}

function formatRate(load: LoadCardModel): { display: string; label: string } {
    if (load.rate_amount) {
        return {
            display: `${load.rate_currency ?? '$'}${Number(load.rate_amount).toLocaleString()}`,
            label: 'Verified Rate',
        };
    }
    if (load.rate_min && load.rate_max) {
        return {
            display: `$${load.rate_min.toLocaleString()}–$${load.rate_max.toLocaleString()}`,
            label: 'Estimated Range',
        };
    }
    return { display: 'Contact for Rate', label: '' };
}

function gradeColor(grade: string | null | undefined) {
    if (grade === 'A') return 'text-hc-success border-hc-success/25 bg-hc-success/10';
    if (grade === 'B') return 'text-hc-gold-500 border-hc-gold-500/25 bg-hc-gold-500/10';
    if (grade === 'C') return 'text-hc-warning border-hc-warning/25 bg-hc-warning/10';
    return 'text-hc-muted border-hc-border bg-hc-elevated';
}

// ── Risk Badge (fill probability → CRITICAL / TIGHTENING / HEALTHY) ────────
function RiskBadge({ prob }: { prob: number | null | undefined }) {
    if (prob == null) return null;
    if (prob < 0.35) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-danger/10 text-hc-danger border-hc-danger/25">
            RISK: CRITICAL
        </span>
    );
    if (prob < 0.65) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-warning/10 text-hc-warning border-hc-warning/25">
            RISK: TIGHTENING
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-success/10 text-hc-success border-hc-success/25">
            RISK: HEALTHY
        </span>
    );
}

// ── Rate Signal Badge (🟢 Strong Pay / 🟡 Fair Rate / 🔴 Under Market) ────────
function RateSignalBadge({ signal, score }: { signal: string | null | undefined; score: number | null | undefined }) {
    if (!signal) return null;
    if (signal === 'strong') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-success/15 text-hc-success border-hc-success/30" title={`Job Score: ${score ?? '—'}/100`}>
            🟢 Strong Pay
        </span>
    );
    if (signal === 'fair') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-gold-500/15 text-hc-gold-500 border-hc-gold-500/30" title={`Job Score: ${score ?? '—'}/100`}>
            🟡 Fair Rate
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest bg-hc-danger/15 text-hc-danger border-hc-danger/30" title={`Job Score: ${score ?? '—'}/100`}>
            🔴 Under Market
        </span>
    );
}

// ── Trend Arrow (▲ up / ▼ down / ■ stable) ────────
function TrendArrow({ trend }: { trend: string | null | undefined }) {
    if (!trend || trend === 'stable') return (
        <span className="text-[10px] text-hc-muted font-bold" title="Rate trend: stable">■</span>
    );
    if (trend === 'up') return (
        <span className="text-[10px] text-hc-success font-bold" title="Broker rate trending up">▲</span>
    );
    return (
        <span className="text-[10px] text-hc-danger font-bold" title="Broker rate trending down">▼</span>
    );
}

// ── Time Decay Meter — thin bottom bar, green→amber→red based on age ────────
function TimeDecayMeter({ postedAt }: { postedAt: string }) {
    const ageMs = Date.now() - Date.parse(postedAt);
    const ageMin = ageMs / 60000;
    const MAX_MIN = 45;
    const pct = Math.min(100, (ageMin / MAX_MIN) * 100);
    const color = ageMin < 15 ? '#22C55E' : ageMin < 45 ? '#F59E0B' : '#EF4444';
    return (
        <div className="h-[2px] w-full bg-hc-elevated">
            <div
                className="h-full transition-all duration-1000"
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────

function CurfewSentinel({ stateCodes }: { stateCodes: string[] }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-hc-warning/8 border-b border-hc-warning/20">
            <AlertCircle className="w-3.5 h-3.5 text-hc-warning shrink-0" />
            <span className="text-[10px] font-bold text-hc-warning uppercase tracking-widest">
                Curfew Alert: {stateCodes.join(', ')} — verify travel windows before dispatch
            </span>
        </div>
    );
}

// ── Lifecycle Status Banner ───────────────────────────────────
// The most important trust change: jobs never vanish silently.

function HoldCountdown({ expiresAt }: { expiresAt: string }) {
    const [secs, setSecs] = React.useState(() => secondsUntil(expiresAt));
    React.useEffect(() => {
        const id = setInterval(() => setSecs(secondsUntil(expiresAt)), 1000);
        return () => clearInterval(id);
    }, [expiresAt]);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return (
        <span className="tabular-nums font-black">
            {mins > 0 ? `${mins}m ` : ''}{s}s
        </span>
    );
}

function StatusBanner({ load }: { load: LoadCardModel }) {
    const status = load.status ?? 'open';

    if (status === 'open') return null;

    if (status === 'pending_hold') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-hc-warning/10 border-b border-hc-warning/25">
                <Timer className="w-3.5 h-3.5 text-hc-warning animate-pulse shrink-0" />
                <span className="text-[10px] font-black text-hc-warning uppercase tracking-widest flex items-center gap-1">
                    HOLD — Locking In
                    {load.pending_hold_expires_at && (
                        <span className="ml-1 text-hc-text"><HoldCountdown expiresAt={load.pending_hold_expires_at} /></span>
                    )}
                </span>
            </div>
        );
    }

    if (status === 'booked') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-hc-success/8 border-b border-hc-success/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-hc-success shrink-0" />
                <span className="text-[10px] font-black text-hc-success uppercase tracking-widest">
                    ✓ Covered{load.booked_at ? ` — filled ${minutesAgo(load.booked_at)}` : ''}
                </span>
            </div>
        );
    }

    if (status === 'in_progress') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-hc-elevated border-b border-hc-border">
                <Truck className="w-3.5 h-3.5 text-hc-muted shrink-0" />
                <span className="text-[10px] font-black text-hc-muted uppercase tracking-widest">En Route</span>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-hc-elevated/50 border-b border-hc-border-bare">
                <Flag className="w-3.5 h-3.5 text-hc-subtle shrink-0" />
                <span className="text-[10px] font-bold text-hc-subtle uppercase tracking-widest">Completed</span>
            </div>
        );
    }

    return null;
}

// ── Days-to-Pay Badge ─────────────────────────────────────────
function DaysToPayBadge({ days }: { days: number }) {
    const fast = days <= 7;
    const slow = days > 21;
    return (
        <span
            title={`Broker avg pay time: ${days} days`}
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                fast
                    ? 'bg-hc-success/10 text-hc-success border-hc-success/20'
                    : slow
                        ? 'bg-hc-danger/10 text-hc-danger border-hc-danger/20'
                        : 'bg-hc-elevated text-hc-muted border-hc-border',
            )}
        >
            <Banknote className="w-2.5 h-2.5" />
            {days}d pay
        </span>
    );
}

// ── Broker Trust Signals ──────────────────────────────────────
function BrokerTrustRow({ broker }: { broker: NonNullable<LoadCardModel['broker']> }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-hc-muted text-sm truncate max-w-[140px]">
                {broker.name}
            </span>

            {broker.verification && (
                <ShieldCheck className="w-3.5 h-3.5 text-hc-success shrink-0" aria-label="Verified broker" />
            )}

            {/* "Paid on platform before" — removes #1 driver hesitation */}
            {(broker.platform_payment_count ?? 0) > 0 && (
                <span
                    title={`Paid ${broker.platform_payment_count} time${broker.platform_payment_count !== 1 ? 's' : ''} via platform`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-hc-success/10 border border-hc-success/20 text-[10px] font-black text-hc-success uppercase tracking-widest"
                >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Paid on platform
                </span>
            )}

            {/* Deposit funded */}
            {broker.deposit_funded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-hc-gold-500/10 border border-hc-gold-500/20 text-[10px] font-black text-hc-gold-500 uppercase tracking-widest">
                    <DollarSign className="w-2.5 h-2.5" />
                    Deposit Funded
                </span>
            )}

            {/* Dispute flag — shows early, saves escorts from bad actors */}
            {broker.has_open_dispute && (
                <span
                    title="This broker has an open payment dispute"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-hc-warning/10 border border-hc-warning/20 text-[10px] font-black text-hc-warning uppercase tracking-widest"
                >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Open Dispute
                </span>
            )}

            {broker.avg_days_to_pay != null && (
                <DaysToPayBadge days={broker.avg_days_to_pay} />
            )}
        </div>
    );
}

// ── Main Card ─────────────────────────────────────────────────

export function LoadCardV2(props: { load: LoadCardModel }) {
    const { load } = props;
    const posted = minutesAgo(load.posted_at);
    const hasCurfew = load.route_crosses_curfew_state && (load.curfew_state_codes?.length ?? 0) > 0;
    const status = load.status ?? 'open';
    const isOpen = status === 'open';
    const isBooked = status === 'booked' || status === 'in_progress' || status === 'completed';

    const isFastFill = load.fill_speed_bucket === 'fast';
    const signals = Array.from(new Set([
        ...(load.lane_badges ?? []),
        ...(load.explain_top_3 ?? []),
    ])).slice(0, 3);

    const rate = formatRate(load);

    return (
        <article className={cn(
            "hc-card overflow-hidden transition-all duration-200",
            isOpen ? "hover:border-hc-border-high" : "opacity-60",
            isBooked && "pointer-events-none select-none",
        )}>
            {/* ── Curfew Sentinel ── */}
            {hasCurfew && <CurfewSentinel stateCodes={load.curfew_state_codes!} />}

            {/* ── Lifecycle Status Banner ── */}
            <StatusBanner load={load} />

            {/* ── Intelligence Header ── */}
            <div className="px-4 py-2 border-b border-hc-border-bare flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-1.5 items-center flex-wrap">
                    {/* Rate Signal Badge — the market pressure indicator */}
                    {isOpen && <RateSignalBadge signal={load.rate_signal} score={load.escort_job_score} />}
                    {isOpen && <TrendArrow trend={load.rate_trend} />}
                    {load.load_quality_grade && (
                        <span className={cn("px-2 py-0.5 rounded-lg font-black text-[10px] border uppercase tracking-widest", gradeColor(load.load_quality_grade))}>
                            Grade {load.load_quality_grade}
                        </span>
                    )}
                    {/* Risk badge — from fill probability */}
                    {isOpen && <RiskBadge prob={load.fill_probability_01} />}
                    {isFastFill && (
                        <span className="flex items-center gap-1 text-hc-gold-500 font-black bg-hc-gold-500/10 px-2 py-0.5 rounded-lg border border-hc-gold-500/20 text-[10px] uppercase tracking-widest">
                            <Zap className="w-2.5 h-2.5" /> Fast Fill
                        </span>
                    )}
                    {load.estimated_fill_time_min != null && (
                        <span className="flex items-center gap-1 text-hc-muted bg-hc-elevated px-2 py-0.5 rounded-lg border border-hc-border text-[10px] font-semibold">
                            <Timer className="w-2.5 h-2.5" />
                            ~{load.estimated_fill_time_min}min to fill
                        </span>
                    )}
                    {signals.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-hc-elevated border border-hc-border rounded text-hc-muted font-medium text-[10px] uppercase tracking-wide">
                            {s}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-hc-subtle text-xs">
                    {/* Escort Job Score — numeric display */}
                    {isOpen && load.escort_job_score != null && (
                        <span className={cn(
                            'font-black tabular-nums text-[11px]',
                            load.escort_job_score >= 80 ? 'text-hc-success' : load.escort_job_score >= 60 ? 'text-hc-gold-500' : 'text-hc-danger'
                        )}>
                            {load.escort_job_score}
                        </span>
                    )}
                    <Clock className="w-3 h-3" />
                    {posted}
                </div>
            </div>

            {/* ── Body: Pay-First Layout ── */}
            <div className="p-4 grid md:grid-cols-[1fr_auto] gap-6">

                {/* LEFT: PAY FIRST, then route */}
                <div className="flex flex-col gap-4">

                    {/* ★ Rate is now at the TOP — no longer buried bottom-right */}
                    <div>
                        <div className="text-2xl font-black text-hc-text tracking-tight tabular-nums">
                            {isBooked ? (
                                <span className="text-base text-hc-success font-black">✓ {status === 'completed' ? 'Completed' : 'Covered'}</span>
                            ) : (
                                rate.display
                            )}
                        </div>
                        {rate.label && !isBooked && (
                            <div className="text-[10px] text-hc-success font-bold uppercase tracking-widest mt-0.5">
                                {rate.label}
                            </div>
                        )}
                        {/* Deadhead miles */}
                        {!isBooked && load.deadhead_miles != null && (
                            <div className="text-xs text-hc-gold-500 font-bold mt-1">
                                ~{load.deadhead_miles}mi deadhead
                            </div>
                        )}
                        {/* Net estimate */}
                        {!isBooked && load.net_after_fees_estimate != null && (
                            <div className="text-xs text-hc-muted font-medium mt-0.5">
                                ~${load.net_after_fees_estimate.toLocaleString()} net after fees
                            </div>
                        )}
                        {/* Scarcity line — escorts nearby + ETA */}
                        {!isBooked && (load.nearby_available_count ?? 0) > 0 && (
                            <div className="text-[10px] text-hc-subtle font-medium mt-1">
                                {load.nearby_available_count} escorts nearby
                                {load.estimated_fill_time_min != null && ` • ETA ~${load.estimated_fill_time_min}m`}
                            </div>
                        )}
                        {/* High match probability */}
                        {!isBooked && (load.fill_probability_01 ?? 0) > 0.7 && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-hc-gold-500 font-black uppercase tracking-tight">
                                <Star className="w-3 h-3" />
                                High match probability
                            </div>
                        )}
                    </div>

                    {/* Route */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-hc-gold-500 shrink-0" />
                            <div>
                                <div className="font-bold text-base text-hc-text leading-none">{formatLocation(load.origin)}</div>
                                <div className="text-[10px] text-hc-subtle uppercase tracking-widest font-semibold mt-0.5">Origin</div>
                            </div>
                        </div>
                        <div className="ml-1 w-0.5 h-4 bg-hc-border-bare" />
                        <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-2 h-2 rounded-full border-2 border-hc-gold-500 shrink-0" />
                            <div>
                                <div className="font-bold text-base text-hc-text leading-none">{formatLocation(load.destination)}</div>
                                <div className="text-[10px] text-hc-subtle uppercase tracking-widest font-semibold mt-0.5">Destination</div>
                            </div>
                        </div>
                    </div>

                    {/* Service + Broker trust row */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-hc-elevated border border-hc-border text-hc-text font-semibold text-xs">
                                {load.service_required}
                            </span>
                        </div>
                        {load.broker && <BrokerTrustRow broker={load.broker} />}
                    </div>
                </div>

                {/* RIGHT: CTA (only active when open) */}
                <div className="flex flex-col items-start md:items-end justify-end gap-3 min-w-[160px]">
                    {isOpen ? (
                        <div className="w-full">
                            <UnlockButton loadId={load.id} />
                            {load.contact_locked !== false && (
                                <div className="flex items-center justify-center gap-1 text-[10px] text-hc-subtle mt-1.5">
                                    <Lock className="w-3 h-3" />
                                    Free account to view contact
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-end gap-1">
                            {status === 'booked' && (
                                <span className="text-[10px] font-bold text-hc-success uppercase tracking-widest">
                                    {load.booked_at ? `Filled ${minutesAgo(load.booked_at)}` : 'Filled'}
                                </span>
                            )}
                            {status === 'pending_hold' && (
                                <span className="text-[10px] font-bold text-hc-warning uppercase tracking-widest">Hold Active</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Time Decay Meter — thin bottom progress bar ── */}
            {isOpen && <TimeDecayMeter postedAt={load.posted_at} />}
        </article>
    );
}
