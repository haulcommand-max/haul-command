import Link from 'next/link';
import { MapPin, CheckCircle, AlertTriangle, Flag, Box, Wrench, ShieldAlert } from 'lucide-react';
import { ClaimProfileCTA } from '@/components/profile/ClaimProfileCTA';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { OperatorTrustCard } from '@/components/profile/OperatorTrustCard';
import { OperatorReportCard } from '@/components/profile/OperatorReportCard';
import { OperatorBadges } from '@/components/profile/OperatorBadges';
import { OperatorReviews } from '@/components/profile/OperatorReviews';
import { SchemaOrchestrator } from '@/components/seo/SchemaOrchestrator';
import { ClaimListingCTA } from '@/components/seo/ConversionCTAs';

interface EntityProps {
    op: any;
    isClaimed: boolean;
    trustPct: number;
    trustColor: string;
    trustLabel: string;
    location: string;
    countryFlag: string;
}

export function OperatorTemplate({ op, isClaimed, trustPct, trustColor, trustLabel, location, countryFlag }: EntityProps) {
    return (
        <BaseTemplate
            entityName="Heavy Haul Operator"
            op={op}
            isClaimed={isClaimed}
            trustPct={trustPct}
            trustColor={trustColor}
            trustLabel={trustLabel}
            location={location}
            countryFlag={countryFlag}
            icon={<Box style={{ width: 28, height: 28 }} />}
            specificMetrics={
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Fleet Size</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#9ca3af' }}>{op.fleet_size || 'Unknown'}</div>
                </div>
            }
        />
    );
}

export function InfrastructureTemplate({ op, isClaimed, trustPct, trustColor, trustLabel, location, countryFlag, typeLabel, iconObj }: EntityProps & { typeLabel: string, iconObj: React.ReactNode }) {
    return (
        <BaseTemplate
            entityName={typeLabel}
            op={op}
            isClaimed={isClaimed}
            trustPct={trustPct}
            trustColor={trustColor}
            trustLabel={trustLabel}
            location={location}
            countryFlag={countryFlag}
            icon={iconObj}
            specificMetrics={
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Facilities</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af' }}>{op.facilities || 'Unverified'}</div>
                </div>
            }
        />
    );
}

function BaseTemplate({ entityName, op, isClaimed, trustPct, trustColor, trustLabel, location, countryFlag, icon, specificMetrics }: EntityProps & { entityName: string, icon: React.ReactNode, specificMetrics?: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
            {/* Rich Results — Schema.org structured data for Google/AI search */}
            <SchemaOrchestrator
                type="DriverProfile"
                data={{
                    name: op.name || entityName,
                    state: op.region_code || '',
                    url: `https://www.haulcommand.com/directory/profile/${op.slug || op.id}`,
                    ratingCount: op.reviews?.length || 0,
                    ratingValue: op.reviews?.length ? (op.reviews.reduce((s: number, r: any) => s + (r.rating || 4.5), 0) / op.reviews.length).toFixed(1) : '4.8',
                    reviews: op.reviews?.slice(0, 5) || [],
                }}
            />
            {/* Breadcrumb */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 0' }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <span>›</span>
                    {op.region_code && (
                        <>
                            <Link href={`/directory/us/${op.region_code.toLowerCase()}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
                                {op.region_code}
                            </Link>
                            <span>›</span>
                        </>
                    )}
                    <span style={{ color: '#d1d5db' }}>{op.name || 'Listing'}</span>
                </nav>
            </div>

            {/* Profile header */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
                
                {/* Data Accuracy Warning for Unclaimed */}
                {!isClaimed && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <ShieldAlert style={{ color: '#ef4444', width: 18, height: 18, marginTop: 2 }} />
                        <div>
                            <p style={{ margin: 0, fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>Unverified Third-Party Listing</p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444', opacity: 0.8 }}>This entity is not managed or verified by Haul Command. Data freshness and availability are not guaranteed.</p>
                        </div>
                    </div>
                )}

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{ width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg, rgba(241,169,27,0.15), rgba(241,169,27,0.05))', border: '1px solid rgba(241,169,27,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, color: '#F1A91B' }}>
                            {icon || countryFlag}
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#f9fafb' }}>
                                    {op.name || 'Entity Profile'}
                                </h1>
                                {isClaimed ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                                        <CheckCircle style={{ width: 10, height: 10 }} /> Verified & Claimed
                                    </span>
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>
                                        Unclaimed Data
                                    </span>
                                )}
                            </div>
                            {location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                                    <MapPin style={{ width: 12, height: 12 }} /> {location}
                                    {op.country_code && <span style={{ marginLeft: 4, fontSize: 11, color: '#4b5563' }}>({op.country_code})</span>}
                                </div>
                            )}
                            <span style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#F1A91B', textTransform: 'capitalize' }}>
                                {entityName}
                            </span>
                        </div>
                    </div>

                    {/* Discovery Metrics */}
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                        {isClaimed && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Trust Score</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: trustColor, fontFamily: "'JetBrains Mono', monospace" }}>{trustPct}</div>
                                <div style={{ fontSize: 10, color: trustColor, fontWeight: 600 }}>{trustLabel}</div>
                            </div>
                        )}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Availability</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: isClaimed ? '#10b981' : '#9ca3af' }}>
                                {isClaimed ? 'Live Active' : 'Unverified'}
                            </div>
                        </div>
                        {specificMetrics}
                    </div>
                </div>

                {/* AdGrid Monetization — Live Supabase-backed ad slot */}
                <div style={{ marginBottom: 24 }}>
                    <AdGridSlot zone="profile_spotlight" />
                </div>

                {/* Engagement / Claim Gate */}
                {!isClaimed ? (
                    <div style={{ marginBottom: 24 }}>
                        {/* SEO Conversion CTA — featured snippet ready */}
                        <ClaimListingCTA entityId={op.slug || op.id || ''} companyName={op.name} variant="banner" />
                        <div style={{ marginTop: 12 }} />
                        <ClaimProfileCTA
                            operatorId={op.slug || op.id || ''}
                            operatorName={op.name || entityName}
                            hcId={op.hc_id || null}
                        />
                        <div style={{ marginTop: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Link href={`/loads/post?operator=${op.slug || op.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>
                                ✉ Request This Escort Anyway
                            </Link>
                            <Link href={`/directory/report?slug=${op.slug}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 12, fontWeight: 600, borderRadius: 10, textDecoration: 'none' }}>
                                <Flag style={{ width: 12, height: 12 }} /> Report Incorrect Info
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: 24 }}>
                        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1 }}>Engage Verified {entityName}</h2>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                            This operator is verified and actively monitored on Haul Command.
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link href={`/loads/post?operator=${op.slug || op.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                ✉ Request This Escort
                            </Link>
                            <Link href="/available-now" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                📡 View Live Availability
                            </Link>
                            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                Sign In for Contact Data
                            </Link>
                        </div>
                    </div>
                )}

                {/* Intelligence Modules — Trust, Report Card, Badges, Reviews */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <OperatorTrustCard
                        trust={op.trust_breakdown ?? null}
                        operator={op}
                        tierColor={trustColor}
                    />
                    <OperatorReportCard
                        reportCard={op.report_card ?? null}
                        operator={op}
                    />
                </div>

                {/* Badges — only show if any exist */}
                {op.badges && Array.isArray(op.badges) && op.badges.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <OperatorBadges badges={op.badges} />
                    </div>
                )}

                {/* Reviews */}
                <div style={{ marginBottom: 24 }}>
                    <OperatorReviews
                        reviews={op.reviews ?? []}
                        operatorName={op.name || 'This operator'}
                        operatorId={op.slug || op.id || ''}
                    />
                </div>
            </div>
        </div>
    );
}
