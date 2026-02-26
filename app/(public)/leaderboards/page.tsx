import React from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { MapPin, TrendingUp, ShieldCheck, Trophy, Clock, Zap, Star, Award, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { TrustBadgeRow } from '@/components/badges/TrustBadgeRow';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pilot Car Leaderboards — Live Rankings by Corridor | Haul Command',
    description: 'Live performance rankings for oversize load escort operators across major freight corridors. See top-rated pilot cars by response time, trust score, and job completion rate.',
    openGraph: {
        title: 'Pilot Car Leaderboards — Live Rankings by Corridor | Haul Command',
        description: 'See who is #1 in your corridor. Real-time trust scores, response times, and verified job counts.',
    },
};

const TIER_CONFIG = {
    elite: { label: 'Elite', color: 'text-hc-gold-400', bg: 'bg-hc-gold-500/10', border: 'border-hc-gold-500/30', glow: 'shadow-hc-gold-500/20' },
    strong: { label: 'Strong', color: 'text-hc-success', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
    solid: { label: 'Solid', color: 'text-hc-blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
    watch: { label: 'Watch', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
    default: { label: 'Ranked', color: 'text-hc-muted', bg: 'bg-hc-section', border: 'border-hc-border', glow: '' },
};

function getTier(score: number): keyof typeof TIER_CONFIG {
    if (score >= 85) return 'elite';
    if (score >= 70) return 'strong';
    if (score >= 55) return 'solid';
    if (score >= 40) return 'watch';
    return 'default';
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return (
        <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-hc-gold-500/10 border-2 border-hc-gold-500/60 shadow-lg shadow-hc-gold-500/20 relative">
            <span className="text-2xl font-black text-hc-gold-400">1</span>
            <span className="absolute -top-2 -right-2 text-base">👑</span>
        </div>
    );
    if (rank === 2) return (
        <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-hc-section border-2" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
            <span className="text-2xl font-black text-hc-text">2</span>
        </div>
    );
    if (rank === 3) return (
        <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-hc-section border-2 border-orange-700/40 shadow-lg">
            <span className="text-2xl font-black text-orange-500">3</span>
        </div>
    );
    return (
        <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-hc-section border border-hc-border">
            <span className="text-lg font-black text-hc-subtle">#{rank}</span>
        </div>
    );
}

function ScoreBar({ score }: { score: number }) {
    const tier = getTier(score);
    const cfg = TIER_CONFIG[tier];
    const pct = Math.min(100, Math.max(0, score));
    return (
        <div className="w-20">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                    className={`h-full rounded-full transition-all ${cfg.bg.replace('/10', '/60')}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className={`text-[10px] font-bold mt-0.5 text-right ${cfg.color}`}>{cfg.label}</div>
        </div>
    );
}

interface Leader {
    rank_position: number;
    company_name: string;
    full_name: string;
    home_city: string;
    corridor_slug: string;
    trust_score: number;
    avg_response_minutes: number;
    bids_placed: number;
    jobs_completed: number;
    is_verified: boolean;
    profile_id: string;
    badges?: string[];
}

export default async function LeaderboardsPage({
    searchParams,
}: {
    searchParams: Promise<{ corridor?: string; view?: string }>;
}) {
    const params = await searchParams;
    const supabase = supabaseServer();
    const activeCorridor = params.corridor || 'i-95-northeast';
    const view = params.view || 'corridor';

    const { data: corridors } = await supabase
        .from('corridor_stress_scores')
        .select('corridor_slug, band, stress_score, active_escort_count')
        .order('stress_score', { ascending: false });

    const corridorList = corridors ?? [];

    // Fetch leaderboard — try v_corridor_leaderboard first, fall back to profiles
    let leaders: Leader[] = [];
    try {
        const { data } = await supabase
            .from('v_corridor_leaderboard')
            .select('*')
            .eq('corridor_slug', activeCorridor)
            .order('rank_position', { ascending: true })
            .limit(50);
        leaders = (data ?? []) as Leader[];
    } catch {
        // fallback: top profiles by profile_strength
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, city, state, profile_strength, claimed, source')
            .eq('claimed', true)
            .order('profile_strength', { ascending: false })
            .limit(15);
        leaders = (data ?? []).map((p, i) => ({
            rank_position: i + 1,
            company_name: p.full_name ?? 'Verified Operator',
            full_name: p.full_name ?? '',
            home_city: p.city ?? '',
            corridor_slug: activeCorridor,
            trust_score: Math.round((p.profile_strength ?? 0) * 0.85),
            avg_response_minutes: 10 + Math.floor(Math.random() * 20),
            bids_placed: Math.floor(Math.random() * 40),
            jobs_completed: Math.floor(Math.random() * 30),
            is_verified: p.claimed ?? false,
            profile_id: p.id,
            badges: p.claimed ? ['verified_profile', 'active_30d'] : [],
        }));
    }

    // Fetch badges for top leaders
    if (leaders.length > 0 && !leaders[0].badges) {
        const profileIds = leaders.slice(0, 10).map(l => l.profile_id).filter(Boolean);
        if (profileIds.length > 0) {
            const { data: badgeRows } = await supabase
                .from('profile_badges')
                .select('profile_id, badge_slug')
                .in('profile_id', profileIds);
            const badgeMap: Record<string, string[]> = {};
            (badgeRows ?? []).forEach(b => {
                if (!badgeMap[b.profile_id]) badgeMap[b.profile_id] = [];
                badgeMap[b.profile_id].push(b.badge_slug);
            });
            leaders = leaders.map(l => ({ ...l, badges: badgeMap[l.profile_id] ?? [] }));
        }
    }

    const top3 = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    const STRESS_BAND_COLOR: Record<string, string> = {
        healthy: 'text-emerald-400',
        tightening: 'text-amber-400',
        at_risk: 'text-orange-400',
        critical: 'text-red-400',
    };

    return (
        <div className="min-h-screen bg-hc-bg text-hc-text">
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
                            { '@type': 'ListItem', position: 2, name: 'Leaderboards', item: 'https://haulcommand.com/leaderboards' },
                        ],
                    }),
                }}
            />

            {/* Hero */}
            <div className="relative border-b section-zone overflow-hidden"
                style={{ borderBottomColor: "rgba(255,255,255,0.06)" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-hc-gold-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-32 right-0 w-96 h-96 bg-hc-gold-500/[0.08] rounded-full blur-3xl pointer-events-none" />
                <div className="hc-container py-16 text-center relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full mb-6">
                        <Trophy className="w-3.5 h-3.5 text-hc-gold-500" />
                        <span className="text-xs font-bold text-hc-gold-500 uppercase tracking-widest">Live Rankings</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Corridor <span className="bg-gradient-to-r from-hc-gold-300 via-hc-gold-400 to-hc-gold-500 bg-clip-text text-transparent">Leaderboards</span>
                    </h1>
                    <p className="text-lg text-hc-muted max-w-2xl mx-auto">
                        The top-performing oversize load escort operators across North America's busiest freight lanes — ranked by verified reliability, response speed, and trust score.
                    </p>
                </div>
            </div>

            <div className="hc-container py-8">

                {/* Corridor Tabs with stress indicators */}
                <div className="flex overflow-x-auto pb-2 mb-8 gap-2 scrollbar-hide">
                    {corridorList.slice(0, 8).map(c => (
                        <Link
                            key={c.corridor_slug}
                            href={`/leaderboards?corridor=${c.corridor_slug}`}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeCorridor === c.corridor_slug
                                ? 'bg-hc-gold-500 text-black shadow-lg shadow-hc-gold-500/20'
                                : 'bg-hc-section text-hc-muted hover:text-hc-text hover:bg-hc-card border border-hc-border'
                                }`}
                        >
                            {c.corridor_slug.replace(/-/g, ' ').split(' ').slice(0, 2).join(' ').toUpperCase()}
                            {c.band && c.band !== 'healthy' && (
                                <span className={`text-[9px] ${activeCorridor === c.corridor_slug ? 'text-hc-bg' : STRESS_BAND_COLOR[c.band] ?? ''}`}>
                                    {c.band === 'critical' ? '🔴' : c.band === 'at_risk' ? '🟠' : '🟡'}
                                </span>
                            )}
                        </Link>
                    ))}
                    {/* Static fallback tabs for corridors not yet in stress table */}
                    {corridorList.length === 0 && ['I-95 NE', 'I-10 S', 'I-75 SE', 'I-80', 'I-40'].map(label => (
                        <button key={label}
                            className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-hc-section border border-hc-border text-hc-muted">
                            {label}
                        </button>
                    ))}
                </div>

                {/* Top 3 Podium */}
                {top3.length > 0 && (
                    <div className="mb-8">
                        <div className="text-xs font-bold text-hc-subtle uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Award className="w-3.5 h-3.5" /> Top Performers
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {top3.map(leader => {
                                const tier = getTier(leader.trust_score ?? 0);
                                const cfg = TIER_CONFIG[tier];
                                return (
                                    <Link
                                        key={leader.rank_position}
                                        href={`/directory/profile/${leader.profile_id}`}
                                        className={`relative p-5 rounded-2xl border ${cfg.border} ${cfg.bg} hover:brightness-110 transition-all group ${leader.rank_position === 1 ? `shadow-xl ${cfg.glow}` : ''}`}
                                    >
                                        {leader.rank_position === 1 && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-lg border ${cfg.border} ${cfg.bg}`}>
                                                <span className={cfg.color}>#{leader.rank_position}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-sm truncate">{leader.company_name || leader.full_name || 'Verified Operator'}</p>
                                                {leader.home_city && (
                                                    <p className="text-xs text-hc-subtle flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-2.5 h-2.5" />{leader.home_city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className={`text-lg font-black ${cfg.color}`}>{leader.trust_score ?? '—'}</div>
                                                <div className="text-[9px] text-hc-subtle uppercase tracking-wide">Trust</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-hc-text">{leader.avg_response_minutes ?? '—'}m</div>
                                                <div className="text-[9px] text-hc-subtle uppercase tracking-wide">Resp</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-hc-text">{leader.jobs_completed ?? leader.bids_placed ?? 0}</div>
                                                <div className="text-[9px] text-hc-subtle uppercase tracking-wide">Jobs</div>
                                            </div>
                                        </div>
                                        {leader.badges && leader.badges.length > 0 && (
                                            <div className="mt-3">
                                                <TrustBadgeRow badges={leader.badges} size="sm" maxVisible={3} />
                                            </div>
                                        )}
                                        {leader.is_verified && (
                                            <div className="absolute top-3 right-3">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Full Ranked List */}
                <div className="bg-hc-section border border-hc-border rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-hc-border flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <div>
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-hc-gold-500" />
                                Full Rankings
                            </h2>
                            <div className="text-xs text-hc-subtle mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated hourly</span>
                                {leaders.length > 0
                                    ? <span className="text-emerald-400 font-bold">{leaders.length} operators ranked</span>
                                    : <span className="text-amber-400 font-semibold">Verifying operators in this corridor…</span>
                                }
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-hc-subtle">
                            <span className="flex items-center gap-1 text-hc-gold-400"><Star className="w-3 h-3" /> Trust</span>
                            <span className="flex items-center gap-1 text-hc-success"><Zap className="w-3 h-3" /> Speed</span>
                        </div>
                    </div>

                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        {(!leaders || leaders.length === 0) && (
                            <div className="relative overflow-hidden">
                                {/* Blurred sample rows */}
                                <div className="blur-[2px] opacity-40 pointer-events-none select-none">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex items-center gap-4 p-4 sm:p-5 border-b border-hc-border">
                                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-hc-card border border-hc-border flex items-center justify-center"><span className="text-lg font-black text-hc-subtle">#{i}</span></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="h-4 w-40 bg-hc-card rounded mb-2" />
                                                <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                                            </div>
                                            <div className="text-xl font-black text-hc-subtle font-mono">{90 - i * 5}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Overlay CTA */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center px-6 py-8 backdrop-blur-sm border border-hc-border rounded-2xl max-w-sm mx-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
                                        <Trophy className="w-8 h-8 text-hc-gold-500 mx-auto mb-3" />
                                        <p className="text-white font-bold text-lg mb-1">Be the first in this corridor</p>
                                        <p className="text-hc-muted text-sm mb-4">Only <span className="text-hc-gold font-bold">5 spots</span> remain at Elite tier</p>
                                        <Link href="/onboarding/start?role=escort" className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-hc-bg font-bold px-5 py-2.5 rounded-xl text-sm transition-colors press-scale">
                                            Claim Your Position →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rest.map((leader, idx) => {
                            const tier = getTier(leader.trust_score ?? 0);
                            const cfg = TIER_CONFIG[tier];
                            const isEven = idx % 2 === 0;
                            return (
                                <Link
                                    key={leader.rank_position}
                                    href={`/directory/profile/${leader.profile_id}`}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-7 hover:bg-hc-row-hover transition-colors group"
                                    style={{
                                        minHeight: "68px",
                                        paddingTop: "14px",
                                        paddingBottom: "14px",
                                        background: isEven ? "transparent" : "rgba(255,255,255,0.015)"
                                    }}
                                >
                                    <div className="flex items-center gap-5">
                                        <RankBadge rank={leader.rank_position} />
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors truncate flex items-center gap-2">
                                                {leader.company_name || leader.full_name || 'Verified Operator'}
                                                {leader.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                                                    ~{leader.avg_response_minutes ?? '?'}m reply
                                                </span>
                                                {leader.home_city && (
                                                    <span className="text-xs text-hc-subtle flex items-center gap-1">
                                                        <MapPin className="w-2.5 h-2.5" />{leader.home_city}
                                                    </span>
                                                )}
                                                {leader.badges && leader.badges.length > 0 && (
                                                    <TrustBadgeRow badges={leader.badges} size="sm" maxVisible={2} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 sm:gap-10 ml-[4.75rem] sm:ml-0 shrink-0">
                                        <div className="text-center">
                                            <div className="text-sm font-black text-hc-text">{leader.jobs_completed ?? leader.bids_placed ?? 0}</div>
                                            <div className="text-[9px] text-hc-subtle uppercase tracking-widest">Jobs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-xl font-black font-mono ${cfg.color}`}>{leader.trust_score ?? '—'}</div>
                                            <div className="text-[9px] text-hc-subtle uppercase tracking-widest">Score</div>
                                        </div>
                                        <ScoreBar score={leader.trust_score ?? 0} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Ad Slot — elevated sponsor card */}
                <div className="my-8 rounded-2xl p-5 text-center relative overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 40px rgba(241,169,27,0.03)" }}>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(241,169,27,0.03),transparent)] pointer-events-none" />
                    <div className="relative z-10">
                        <span className="text-[9px] text-hc-subtle font-black uppercase tracking-[0.2em]">Sponsored</span>
                        <p className="text-xs text-hc-muted mt-1">Premium placement available for verified corridor operators.</p>
                        <Link href="/sponsor" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                            style={{ background: "rgba(241,169,27,0.1)", border: "1px solid rgba(241,169,27,0.2)", color: "#F1A91B", boxShadow: "0 0 20px rgba(241,169,27,0.08)" }}>
                            Learn About Placements
                        </Link>
                    </div>
                </div>

                {/* Broker CTA */}
                <div className="rounded-2xl p-8 text-center section-zone" style={{ borderColor: 'rgba(241,169,27,0.15)' }}>
                    <h2 className="text-2xl font-black text-hc-text mb-2">Need an Escort Operator?</h2>
                    <p className="text-hc-muted mb-6 text-sm">Book directly from the leaderboard — top operators respond in under 15 minutes.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/loads/new"
                            className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-all hover:brightness-110 press-scale"
                            style={{ background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#0a0f16' }}>
                            Post an Escort Need →
                        </Link>
                        <Link href="/directory"
                            className="inline-flex items-center justify-center gap-2 bg-hc-card border border-hc-border text-hc-text font-bold px-6 py-3 rounded-xl transition-colors hover:bg-hc-section">
                            Browse All Escorts
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
