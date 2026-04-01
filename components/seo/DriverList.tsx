'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, ChevronRight, Zap, Clock, ShieldCheck } from 'lucide-react';
import { ComplianceBadge } from '@/components/badges/ComplianceBadge';
import { DriverTrustBadge, calculateTrustScore } from '@/components/badges/DriverTrustBadge';
import { GamifiedBadgeSystem, BadgeType } from '@/components/badges/GamifiedBadgeSystem';
import { DriverReportCard } from '@/components/intelligence/ReportCards';

interface DriverItem {
    driver_id: string;
    company_name: string;
    is_verified: boolean;
    is_seeded?: boolean;
    response_time_minutes_est?: number;
    acceptance_rate?: number;
    insurance_level?: string;
    last_active_bucket?: string;
    equipment?: {
        has_high_pole: boolean;
        has_lead_vehicle: boolean;
        has_chase_vehicle: boolean;
    };
}

export const DriverList: React.FC<{ drivers: DriverItem[]; cityName: string }> = ({ drivers, cityName }) => {
    const [dispatchingId, setDispatchingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleDispatch = (id: string, name: string) => {
        setDispatchingId(id);
        setTimeout(() => {
            setDispatchingId(null);
            alert(`Dispatch Sent! ${name} is reviewing your offer. HaulPay Escort Lock initialized.`);
        }, 2000);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    if (!drivers?.length) {
        return (
            <div className="hc-card border-dashed p-12 text-center">
                <p className="text-hc-muted mb-4 italic">No direct matches found in {cityName} city center.</p>
                <button className="px-6 py-2 bg-hc-elevated text-hc-text rounded-full text-sm font-medium hover:bg-hc-high transition-colors press-feedback">
                    Expand to 50mi Radius
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((driver) => {
                const trustScore = calculateTrustScore(driver);
                const trustTier = trustScore >= 70 ? 'high' : trustScore >= 40 ? 'medium' : 'low';

                return (
                    <div
                        key={driver.driver_id}
                        className="hc-card hover-lift p-6 group relative overflow-hidden flex flex-col justify-between"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-hc-text group-hover:text-hc-gold-500 transition-colors">
                                        {driver.company_name ?? "Independent Operator"}
                                    </h3>
                                    <DriverTrustBadge score={trustScore} size="sm" showLabel={false} />
                                    {driver.is_verified && <ComplianceBadge />}
                                </div>
                                <div className="text-xs text-hc-muted flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-hc-elevated rounded text-hc-subtle text-[11px]">
                                        {driver.insurance_level || "Standard Limits"}
                                    </span>
                                    <span>•</span>
                                    <span>{driver.last_active_bucket}</span>
                                </div>

                                {/* Trust Strip (Phase 6) */}
                                <div className="trust-strip mt-2">
                                    <span className={`trust-badge trust-badge--${trustTier}`}>
                                        <ShieldCheck className="w-3 h-3" />
                                        {trustTier === 'high' ? 'Reliable' : trustTier === 'medium' ? 'Good' : 'New'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-hc-gold-500/10 border border-hc-gold-500/20 text-[9px] font-bold text-hc-gold-500 uppercase tracking-widest rounded-md">
                                        ~{driver.response_time_minutes_est || 12}m response
                                    </span>
                                    <span className="px-2 py-0.5 bg-[rgba(13,124,63,0.08)] border border-[rgba(13,124,63,0.15)] text-[9px] font-bold text-[var(--hc-success)] uppercase tracking-widest rounded-md">
                                        {driver.acceptance_rate || 96}% accept
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleExpand(driver.driver_id)}
                                className="bg-hc-elevated p-2 rounded-xl text-hc-subtle hover:text-hc-text transition-colors cursor-pointer press-feedback"
                            >
                                <ChevronRight className={`w-5 h-5 transition-transform ${expandedId === driver.driver_id ? 'rotate-90' : ''}`} />
                            </button>
                        </div>

                        {/* Equipment + Availability Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-hc-elevated/60 p-3 rounded-xl border border-hc-border-bare">
                                <span className="block text-[10px] font-bold text-hc-subtle uppercase mb-1 tracking-wider">Equipment</span>
                                <span className="text-xs text-hc-text">
                                    {driver.equipment?.has_high_pole ? "High Pole, " : ""}
                                    {driver.equipment?.has_lead_vehicle ? "Lead, " : ""}
                                    {driver.equipment?.has_chase_vehicle ? "Chase" : ""}
                                    {!driver.equipment?.has_high_pole && !driver.equipment?.has_lead_vehicle && !driver.equipment?.has_chase_vehicle && "Standard Pilot"}
                                </span>
                            </div>
                            <div className="bg-hc-elevated/60 p-3 rounded-xl border border-hc-border-bare">
                                <span className="block text-[10px] font-bold text-hc-subtle uppercase mb-1 tracking-wider">Availability</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[var(--hc-success)] rounded-full animate-pulse" />
                                    <span className="text-xs text-[var(--hc-success)] font-medium uppercase tracking-tighter">Ready Now</span>
                                </div>
                            </div>
                        </div>

                        {/* Gamified Badges */}
                        <div className="mb-6">
                            <GamifiedBadgeSystem
                                badges={[
                                    driver.is_verified ? 'ELITE' : null,
                                    driver.equipment?.has_high_pole ? 'NIGHT_MOVE' : null,
                                    trustScore > 50 ? 'MILLION_INSURED' : null,
                                ].filter(Boolean) as BadgeType[]}
                                size="sm"
                            />
                        </div>

                        {/* Report Card (expands on click) */}
                        {expandedId === driver.driver_id && (
                            <div className="mb-4 animate-slide-up">
                                <DriverReportCard userId={driver.driver_id} />
                            </div>
                        )}

                        {/* Quick Action Buttons (Phase 6) */}
                        <div className="flex items-center gap-2 pt-4 border-t border-hc-border mt-auto">
                            <button
                                disabled={dispatchingId === driver.driver_id}
                                onClick={() => handleDispatch(driver.driver_id, driver.company_name)}
                                className="flex-1 py-3 px-4 brand-button disabled:bg-hc-elevated disabled:text-hc-subtle text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 press-feedback"
                            >
                                {dispatchingId === driver.driver_id ? (
                                    <>
                                        <Clock className="w-4 h-4 animate-spin" />
                                        Locking Credentials...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5" />
                                        One-Tap Dispatch
                                    </>
                                )}
                            </button>
                            <button className="p-3 bg-hc-elevated hover:bg-hc-high text-hc-muted rounded-xl transition-all flex items-center justify-center press-feedback">
                                <ShieldCheck className="w-4 h-4 text-hc-subtle group-hover:text-[var(--hc-success)] transition-colors" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
