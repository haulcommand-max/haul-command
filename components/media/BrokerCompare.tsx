'use client';

import React from 'react';
import { ShieldCheck, Camera, Radio, Zap, Star, MapPin, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, Award } from 'lucide-react';
import type { VerificationState, MediaItem } from './MediaGallery';

// ── Types ───────────────────────────────────────────────────────────────────

interface CompareOperator {
    id: string;
    name: string;
    city: string;
    state: string;
    country_code: string;
    trust_score: number;
    verification_state: VerificationState;
    is_claimed: boolean;
    media_count: number;
    media_completion_pct: number;
    gear_count: number;
    total_gear: number;
    response_time_label: string;
    rating: number;
    review_count: number;
    service_area_miles: number;
    freshness_avg: number;
    capabilities: Record<string, boolean>;
    primary_image_url?: string;
}

interface BrokerCompareProps {
    operators: CompareOperator[];
    isPaidUser?: boolean;
}

// ── Capability list ─────────────────────────────────────────────────────────

const COMPARE_CAPABILITIES = [
    { key: 'beacon', label: 'Beacon', icon: Zap },
    { key: 'signs', label: 'Signs', icon: AlertTriangle },
    { key: 'flags', label: 'Flags', icon: AlertTriangle },
    { key: 'poles', label: 'Height Poles', icon: TrendingUp },
    { key: 'radios', label: 'Radios', icon: Radio },
    { key: 'ppe', label: 'PPE', icon: ShieldCheck },
    { key: 'night_capable', label: 'Night Capable', icon: Star },
    { key: 'weekend_capable', label: 'Weekend', icon: Clock },
    { key: 'dot_registered', label: 'DOT', icon: Award },
    { key: 'insured', label: 'Insured', icon: ShieldCheck },
    { key: 'twic', label: 'TWIC', icon: Award },
];

// ── Helper: Score Color ─────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
}

function scoreBg(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

// ── Compare Component ───────────────────────────────────────────────────────

export function BrokerCompare({ operators, isPaidUser }: BrokerCompareProps) {
    if (operators.length < 2) return null;
    const cols = operators.slice(0, 4); // max 4 columns

    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Compare Operators</h3>
                    <p className="text-[10px] text-[#555] mt-0.5">{cols.length} operators selected</p>
                </div>
                {!isPaidUser && (
                    <div className="bg-[#C6923A]/10 border border-[#C6923A]/20 rounded-lg px-3 py-1.5">
                        <span className="text-[9px] text-[#C6923A] font-bold uppercase tracking-wider">Upgrade for full compare →</span>
                    </div>
                )}
            </div>

            {/* Operator Headers */}
            <div className={`grid grid-cols-${cols.length + 1} border-b border-[#111]`} style={{ gridTemplateColumns: `200px repeat(${cols.length}, 1fr)` }}>
                <div className="px-4 py-3 bg-[#060606]" />
                {cols.map(op => (
                    <div key={op.id} className="px-4 py-3 bg-[#060606] border-l border-[#111] text-center">
                        {op.primary_image_url ? (
                            <img src={op.primary_image_url} alt={op.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-[#222]" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#111] border border-[#222] mx-auto mb-2 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-[#333]" />
                            </div>
                        )}
                        <div className="text-xs font-bold text-white truncate">{op.name}</div>
                        <div className="text-[9px] text-[#555] flex items-center justify-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />{op.city}, {op.state}
                        </div>
                    </div>
                ))}
            </div>

            {/* Trust Score Row */}
            <CompareRow label="Trust Score" icon={<ShieldCheck className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center">
                        <span className={`text-2xl font-black ${scoreColor(op.trust_score)}`}>{op.trust_score}</span>
                        <span className="text-[9px] text-[#444]">/100</span>
                    </div>
                ))}
            </CompareRow>

            {/* Verification State */}
            <CompareRow label="Verification" icon={<CheckCircle className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <VerBadge key={op.id} state={op.verification_state} />
                ))}
            </CompareRow>

            {/* Media Completion */}
            <CompareRow label="Media Photos" icon={<Camera className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-xs font-bold text-white">{op.media_count}/10</span>
                        </div>
                        <div className="w-16 h-1 bg-[#111] rounded-full overflow-hidden mx-auto">
                            <div className={`h-full rounded-full ${scoreBg(op.media_completion_pct)}`} style={{ width: `${op.media_completion_pct}%` }} />
                        </div>
                    </div>
                ))}
            </CompareRow>

            {/* Gear Count */}
            <CompareRow label="Gear Verified" icon={<Award className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center">
                        <span className="text-xs font-bold text-white">{op.gear_count}/{op.total_gear}</span>
                    </div>
                ))}
            </CompareRow>

            {/* Response Time */}
            <CompareRow label="Response Time" icon={<Clock className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center text-xs font-bold text-white">{op.response_time_label}</div>
                ))}
            </CompareRow>

            {/* Rating */}
            <CompareRow label="Rating" icon={<Star className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center">
                        <span className="text-xs font-bold text-amber-400">{op.rating.toFixed(1)}</span>
                        <span className="text-[9px] text-[#444] ml-1">({op.review_count})</span>
                    </div>
                ))}
            </CompareRow>

            {/* Coverage */}
            <CompareRow label="Coverage" icon={<MapPin className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center text-xs font-bold text-white">{op.service_area_miles} mi</div>
                ))}
            </CompareRow>

            {/* Freshness */}
            <CompareRow label="Freshness" icon={<TrendingUp className="w-3.5 h-3.5 text-[#C6923A]" />} operators={cols}>
                {cols.map(op => (
                    <div key={op.id} className="text-center">
                        <div className="w-16 h-1 bg-[#111] rounded-full overflow-hidden mx-auto mb-0.5">
                            <div className={`h-full rounded-full ${scoreBg(op.freshness_avg)}`} style={{ width: `${op.freshness_avg}%` }} />
                        </div>
                        <span className="text-[9px] text-[#555]">{op.freshness_avg}%</span>
                    </div>
                ))}
            </CompareRow>

            {/* Capability Matrix */}
            <div className="px-4 py-2 bg-[#060606] border-t border-[#111]">
                <span className="text-[9px] text-[#444] font-bold uppercase tracking-[0.2em]">Capability Matrix</span>
            </div>
            {COMPARE_CAPABILITIES.map(cap => (
                <CompareRow key={cap.key} label={cap.label} icon={<cap.icon className="w-3 h-3 text-[#555]" />} operators={cols} compact>
                    {cols.map(op => (
                        <div key={op.id} className="text-center">
                            {op.capabilities[cap.key] ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                                <XCircle className="w-4 h-4 text-[#222] mx-auto" />
                            )}
                        </div>
                    ))}
                </CompareRow>
            ))}
        </div>
    );
}

// ── Compare Row ─────────────────────────────────────────────────────────────

function CompareRow({ label, icon, operators, children, compact }: {
    label: string; icon: React.ReactNode; operators: CompareOperator[];
    children: React.ReactNode; compact?: boolean;
}) {
    return (
        <div className={`grid border-b border-[#111] ${compact ? 'py-1.5' : 'py-3'}`}
            style={{ gridTemplateColumns: `200px repeat(${operators.length}, 1fr)` }}>
            <div className="px-4 flex items-center gap-2">
                {icon}
                <span className="text-[10px] text-[#888] font-semibold">{label}</span>
            </div>
            {React.Children.map(children, (child, i) => (
                <div key={i} className="px-4 flex items-center justify-center border-l border-[#111]">
                    {child}
                </div>
            ))}
        </div>
    );
}

// ── Verification Badge ──────────────────────────────────────────────────────

function VerBadge({ state }: { state: VerificationState }) {
    const map: Record<VerificationState, { label: string; color: string }> = {
        self_reported: { label: 'Self', color: 'text-[#555]' },
        photo_backed: { label: 'Photo', color: 'text-blue-400' },
        document_backed: { label: 'Doc', color: 'text-purple-400' },
        haul_command_verified: { label: 'HC ✓', color: 'text-emerald-400' },
    };
    const c = map[state];
    return <div className={`text-center text-[10px] font-bold uppercase ${c.color}`}>{c.label}</div>;
}

// ── Broker Trust Card (compact card for directory) ──────────────────────────

export function BrokerTrustCard({ operator }: { operator: CompareOperator }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#C6923A]/30 transition-colors group cursor-pointer">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                {operator.primary_image_url ? (
                    <img src={operator.primary_image_url} alt={operator.name} className="w-14 h-14 rounded-lg object-cover border border-[#222]" />
                ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center">
                        <Camera className="w-5 h-5 text-[#333]" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-[#C6923A] transition-colors">{operator.name}</h4>
                        {operator.verification_state === 'haul_command_verified' && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[#555]">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{operator.city}, {operator.state}</span>
                        <span>·</span>
                        <span>{operator.service_area_miles}mi radius</span>
                    </div>
                </div>

                {/* Trust Score */}
                <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-black ${scoreColor(operator.trust_score)}`}>{operator.trust_score}</div>
                    <div className="text-[8px] text-[#444] uppercase tracking-wider">Trust</div>
                </div>
            </div>

            {/* Metrics strip */}
            <div className="mt-3 pt-3 border-t border-[#111] grid grid-cols-4 gap-2">
                <MetricCell label="Photos" value={`${operator.media_count}/10`} color={scoreBg(operator.media_completion_pct)} pct={operator.media_completion_pct} />
                <MetricCell label="Gear" value={`${operator.gear_count}/${operator.total_gear}`} color={scoreBg((operator.gear_count / operator.total_gear) * 100)} pct={(operator.gear_count / operator.total_gear) * 100} />
                <MetricCell label="Response" value={operator.response_time_label} />
                <MetricCell label="Rating" value={`${operator.rating.toFixed(1)} ★`} />
            </div>
        </div>
    );
}

function MetricCell({ label, value, color, pct }: { label: string; value: string; color?: string; pct?: number }) {
    return (
        <div className="text-center">
            <div className="text-[10px] font-bold text-white mb-0.5">{value}</div>
            {pct !== undefined && (
                <div className="w-full h-0.5 bg-[#111] rounded-full overflow-hidden mb-0.5">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
            )}
            <div className="text-[8px] text-[#444] uppercase tracking-wider">{label}</div>
        </div>
    );
}
