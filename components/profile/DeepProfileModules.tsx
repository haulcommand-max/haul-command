'use client';

/**
 * DeepProfileModules — Band B Rank 3
 * 
 * Modular profile depth components that turn identity pages into decision engines.
 * Each module is independently usable on profile pages, search results, etc.
 * 
 * Modules:
 *   - CapabilityMatrix: service types, equipment, specializations
 *   - ServiceAreaModule: home market, nearby states, corridor relevance
 *   - ContactPreferenceModule: best contact method, response speed, verification
 *   - ActivitySignal: active now / recently / inactive indicator
 *   - RecentActivityContext: last seen market, recent corridor activity
 *   - TrustStrengthSummary: profile strength meter, claimed status, data freshness
 */

import { useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

/* ═══════════════════════════════════
   1. CAPABILITY MATRIX
   ═══════════════════════════════════ */
export function CapabilityMatrix({
    serviceTypes = [],
    equipment = [],
    specializations = [],
    className = '',
}: {
    serviceTypes?: string[];
    equipment?: string[];
    specializations?: string[];
    className?: string;
}) {
    if (serviceTypes.length === 0 && equipment.length === 0 && specializations.length === 0) {
        return (
            <div className={className} style={{
                padding: '14px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6 }}>Capabilities</div>
                <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                    Not yet specified — claim this profile to add capabilities
                </div>
            </div>
        );
    }

    return (
        <div className={className} style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Capabilities
            </div>
            {serviceTypes.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6 }}>Service Types</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {serviceTypes.map(t => (
                            <span key={t} style={{
                                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.15)',
                                color: '#F1A91B',
                            }}>{t}</span>
                        ))}
                    </div>
                </div>
            )}
            {equipment.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6 }}>Equipment</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {equipment.map(e => (
                            <span key={e} style={{
                                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                                color: '#3B82F6',
                            }}>{e}</span>
                        ))}
                    </div>
                </div>
            )}
            {specializations.length > 0 && (
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6 }}>Specializations</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {specializations.map(s => (
                            <span key={s} style={{
                                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                                color: '#8B5CF6',
                            }}>{s}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════
   2. SERVICE AREA MODULE
   ═══════════════════════════════════ */
export function ServiceAreaModule({
    homeMarket,
    nearbyStates = [],
    corridorRelevance = [],
    className = '',
}: {
    homeMarket?: string;
    nearbyStates?: string[];
    corridorRelevance?: { name: string; slug: string }[];
    className?: string;
}) {
    return (
        <div className={className} style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Service Area
            </div>
            {homeMarket ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>📍</span>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{homeMarket}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>Home market</div>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 10 }}>
                    Home market not specified
                </div>
            )}
            {nearbyStates.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6 }}>Nearby States</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {nearbyStates.map(s => (
                            <span key={s} style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: '#ccc',
                            }}>{s}</span>
                        ))}
                    </div>
                </div>
            )}
            {corridorRelevance.length > 0 && (
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 6 }}>Relevant Corridors</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {corridorRelevance.map(c => (
                            <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)',
                                color: '#22C55E', textDecoration: 'none',
                            }}>{c.name}</Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════
   3. CONTACT PREFERENCE MODULE
   ═══════════════════════════════════ */
export function ContactPreferenceModule({
    bestContactMethod,
    phone,
    responseSpeed,
    isVerified = false,
    className = '',
}: {
    bestContactMethod?: string;
    phone?: string;
    responseSpeed?: string;
    isVerified?: boolean;
    className?: string;
}) {
    const handlePhoneClick = () => {
        track('profile_phone_clicked' as any, { metadata: { has_phone: !!phone, verified: isVerified } });
    };

    return (
        <div className={className} style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {phone ? (
                    <a href={`tel:${phone}`} onClick={handlePhoneClick} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                        textDecoration: 'none', color: '#22C55E',
                    }}>
                        <span style={{ fontSize: 16 }}>📞</span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{phone}</div>
                            {bestContactMethod && <div style={{ fontSize: 10, color: '#888' }}>{bestContactMethod}</div>}
                        </div>
                    </a>
                ) : (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <span style={{ fontSize: 16, opacity: 0.4 }}>📞</span>
                        <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                            Contact info hidden — claim to reveal
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {responseSpeed && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                            color: '#3B82F6',
                        }}>⚡ Responds {responseSpeed}</span>
                    )}
                    {isVerified && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                            color: '#22C55E',
                        }}>✓ Verified</span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════
   4. ACTIVITY SIGNAL
   ═══════════════════════════════════ */
export function ActivitySignal({
    status = 'unknown',
    lastActiveAt,
    className = '',
}: {
    status?: 'active_now' | 'active_recently' | 'inactive' | 'unknown';
    lastActiveAt?: string;
    className?: string;
}) {
    const configs = {
        active_now: { label: 'Active Now', color: '#22C55E', pulse: true },
        active_recently: { label: 'Active Recently', color: '#F59E0B', pulse: false },
        inactive: { label: 'Inactive', color: '#6B7280', pulse: false },
        unknown: { label: 'Activity Unknown', color: '#6B7280', pulse: false },
    };
    const config = configs[status];

    return (
        <div className={className} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: `${config.color}10`, border: `1px solid ${config.color}20`,
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%', background: config.color,
                boxShadow: config.pulse ? `0 0 8px ${config.color}40` : 'none',
                animation: config.pulse ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: config.color }}>{config.label}</span>
            {lastActiveAt && status !== 'active_now' && (
                <span style={{ fontSize: 9, color: '#888' }}>· {formatTimeAgo(lastActiveAt)}</span>
            )}
        </div>
    );
}

/* ═══════════════════════════════════
   5. RECENT ACTIVITY CONTEXT
   ═══════════════════════════════════ */
export function RecentActivityContext({
    recentLoadPresence,
    lastSeenMarket,
    recentCorridorActivity = [],
    className = '',
}: {
    recentLoadPresence?: string;
    lastSeenMarket?: string;
    recentCorridorActivity?: string[];
    className?: string;
}) {
    if (!recentLoadPresence && !lastSeenMarket && recentCorridorActivity.length === 0) {
        return null;
    }

    return (
        <div className={className} style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Recent Activity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentLoadPresence && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12 }}>📋</span>
                        <span style={{ fontSize: 12, color: '#bbb' }}>{recentLoadPresence}</span>
                    </div>
                )}
                {lastSeenMarket && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12 }}>📍</span>
                        <span style={{ fontSize: 12, color: '#bbb' }}>Last seen in {lastSeenMarket}</span>
                    </div>
                )}
                {recentCorridorActivity.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12 }}>🛣</span>
                        <span style={{ fontSize: 12, color: '#bbb' }}>Active on {recentCorridorActivity.join(', ')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════
   6. TRUST & STRENGTH SUMMARY
   ═══════════════════════════════════ */
export function TrustStrengthSummary({
    completionPercent = 0,
    isClaimed = false,
    isShell = false,
    dataFreshness,
    verificationTier,
    className = '',
}: {
    completionPercent?: number;
    isClaimed?: boolean;
    isShell?: boolean;
    dataFreshness?: string;
    verificationTier?: 'verified' | 'claimed' | 'seeded' | 'unknown';
    className?: string;
}) {
    const strengthColor = completionPercent > 70 ? '#22C55E' : completionPercent > 40 ? '#F59E0B' : '#EF4444';
    const strengthLabel = completionPercent > 70 ? 'Strong' : completionPercent > 40 ? 'Moderate' : 'Needs Attention';

    const tierConfig = {
        verified: { label: 'VERIFIED', color: '#3B82F6', icon: '🛡' },
        claimed: { label: 'CLAIMED', color: '#22C55E', icon: '✓' },
        seeded: { label: 'SEEDED', color: '#F59E0B', icon: '🌱' },
        unknown: { label: 'UNCLAIMED', color: '#6B7280', icon: '○' },
    };
    const tier = tierConfig[verificationTier || 'unknown'];

    return (
        <div className={className} style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trust & Strength
            </div>

            {/* Profile strength bar */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: strengthColor }}>
                        Profile Strength: {strengthLabel}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>{completionPercent}%</span>
                </div>
                <div style={{
                    width: '100%', height: 6, borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${Math.min(completionPercent, 100)}%`, height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${strengthColor}99, ${strengthColor})`,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                    background: `${tier.color}10`, border: `1px solid ${tier.color}20`,
                    color: tier.color,
                }}>
                    {tier.icon} {tier.label}
                </span>
                {isShell && (
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                        color: '#F59E0B',
                    }}>
                        Auto-generated shell — claim to upgrade
                    </span>
                )}
                {dataFreshness && (
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#888',
                    }}>🕐 {dataFreshness}</span>
                )}
            </div>

            {/* Claim CTA if unclaimed */}
            {!isClaimed && (
                <Link aria-label="Navigation Link" href="/claim" style={{
                    display: 'block', textAlign: 'center', marginTop: 14,
                    padding: '10px 20px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #F1A91B, #f1c27b)',
                    color: '#000', fontWeight: 800, fontSize: 12, textDecoration: 'none',
                }}>
                    Claim to Strengthen Profile
                </Link>
            )}
        </div>
    );
}

// Helper
function formatTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
