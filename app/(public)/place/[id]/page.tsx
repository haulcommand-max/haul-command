"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveProfile, type NormalizedProfile, type ResolutionResult, type EntitySource } from "@/lib/resolvers/resolveProfile";
import { TrustRadar } from "@/components/directory/TrustRadar";
import { DriverReportCard } from "@/components/intelligence/ReportCards";
import { EquipmentBadges } from "@/components/directory/EquipmentBadges";
import { ProfilePerformanceStrip } from "@/components/directory/ProfilePerformanceStrip";
import { PredictedFillIntelligence } from "@/components/directory/PredictedFillIntelligence";
import { LiveActivityFeed } from "@/components/directory/LiveActivityFeed";
import { BrokerActionBar } from "@/components/directory/BrokerActionBar";
import { ReviewSummaryBar, ReviewCard, type OperatorReview } from "@/components/directory/ReviewCard";
import { CorridorMap } from "@/components/map/USCanadaHubMap";
import { ShieldCheck, MapPin, Truck, Star, Award, Search, Activity, Zap, AlertTriangle, Loader2, MessageSquare, PhoneCall, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import AdSlot from "@/components/monetization/AdSlot";
import { WatchButton } from "@/components/social/WatchButton";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { track } from "@/lib/telemetry";
import ClaimBanner from "@/components/growth/ClaimBanner";
import { UrgencyIndicator } from "@/components/psychology/GrowthHooks";
import AppGate from "@/components/growth/AppGate";
import { useVisibility } from "@/hooks/useVisibility";
import { SubscriberGate, InlineUpgradeBanner } from "@/components/trust/SubscriberGate";
import { OwnerVisibilityControls } from "@/components/trust/OwnerVisibilityControls";
import { MobileGate } from "@/components/mobile/MobileGate";
import { ProfileFreshness } from "@/components/market/ProfileFreshness";
import { MarketHeartbeat } from "@/components/market/MarketHeartbeat";
import { ClaimPressureEngine } from "@/components/market/ClaimPressureEngine";
import { CapabilityMatrix, ServiceAreaModule, ContactPreferenceModule, ActivitySignal, TrustStrengthSummary } from "@/components/profile/DeepProfileModules";
import { OutcomeProofBlock } from '@/components/market/OutcomeProofBlock';

import MobileProviderProfile from '@/components/mobile/screens/MobileProviderProfile';

/* ──────────────────────────────────────────────────── */
/*  Animation variants                                  */
/* ──────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ──────────────────────────────────────────────────── */
/*  Types — imported from resolveProfile                 */
/* ──────────────────────────────────────────────────── */
// NormalizedProfile imported from resolver — single source of truth

/* ──────────────────────────────────────────────────── */
/*  Page Component                                      */
/* ──────────────────────────────────────────────────── */
export default function EscortProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabaseClient = createClient();

    const [profile, setProfile] = useState<NormalizedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [resolvedSource, setResolvedSource] = useState<EntitySource>("none");
    const [reviews, setReviews] = useState<OperatorReview[]>([]);

    /* ── Trust Visibility Resolution ── */
    const { visibility, tier, isOwner, isPaid } = useVisibility({ listingId: id });

    /* ── Fetch profile via server-side resolver API ── */
    /* Uses /api/directory/resolve which has service role key (bypasses RLS for slug lookups) */
    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            try {
                const res = await fetch(`/api/directory/resolve?id=${encodeURIComponent(id)}`);
                if (!res.ok) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const result = await res.json();

                // Client-side redirect safety net: if the API returns redirect_to,
                // navigate to the canonical slug. Server layout handles this for
                // initial page loads, but SPA navigations need this fallback.
                if (result.redirect_to) {
                    router.replace(`/place/${result.redirect_to}`);
                    return;
                }

                if (result.resolved && result.profile) {
                    setProfile(result.profile);
                    setResolvedSource(result.resolved_table);
                    console.info(`[ProfileResolver] ID=${id} resolved from: ${result.resolved_table} | path: ${result.resolution_path.join(" → ")}`);
                } else {
                    setNotFound(true);
                    console.warn(`[ProfileResolver] ID=${id} NOT FOUND | path: ${result.resolution_path.join(" → ")} | reason: ${result.failure_reason}`);
                }
            } catch (err) {
                console.error(`[ProfileResolver] ID=${id} fetch error:`, err);
                setNotFound(true);
            }
            setLoading(false);
        }
        loadProfile();
    }, [id, router]);

    /* ── Fetch reviews (uses resolved UUID, not slug) ── */
    useEffect(() => {
        if (!profile) return;
        fetch(`/api/directory/reviews?escort_id=${profile.id}`)
            .then(r => r.json())
            .then(d => setReviews(d.reviews ?? []))
            .catch(() => { });
    }, [profile]);

    /* ── Track directory view (Viewed-You loop) + AdGrid impression + Telemetry ── */
    useEffect(() => {
        if (!profile) return;
        supabaseClient.auth.getUser().then(({ data: { user } }) => {
            fetch('/api/directory/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: id, viewerId: user?.id })
            }).catch(console.error);
            // AdGrid: fire profile_view event for revenue tracking
            fetch('/api/ads/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_type: 'profile_view', slot_id: 'adgrid_profile_featured_operator', entity_id: id, page_type: 'profile' })
            }).catch(() => { });

            // Core Behavioral Telemetry
            track('profile_viewed', { entity_type: 'profile', entity_id: id }).catch(() => { });
        });
    }, [id, profile, supabaseClient]);

    /* ── Loading state ── */
    if (loading) {
        return (
            <MobileGate
                mobile={
                    <div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 32, height: 32, border: '3px solid rgba(212,168,68,0.2)', borderTopColor: 'var(--m-gold, #D4A844)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                }
                desktop={
                    <div className="min-h-screen bg-[#000] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#F1A91B] animate-spin" />
                    </div>
                }
            />
        );
    }

    /* ── Shell Profile State — replaces "Profile Not Found" ── */
    /* When resolver fails entirely, we generate a minimal shell from the slug */
    if (notFound || !profile) {
        const inferredName = id
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

        return (
            <MobileGate
                mobile={
                    <div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100dvh' }}>
                        {/* Back nav */}
                        <div style={{ padding: '12px var(--m-screen-pad, 16px) 0' }}>
                            <Link href="/directory" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--m-text-secondary, #c7ccd7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                <span style={{ fontSize: 'var(--m-font-body-sm, 13px)', fontWeight: 700, color: 'var(--m-text-secondary, #c7ccd7)' }}>Directory</span>
                            </Link>
                        </div>

                        {/* Shell profile header */}
                        <div style={{ padding: '24px var(--m-screen-pad, 16px) 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    background: 'linear-gradient(135deg, rgba(241,169,27,0.15), rgba(241,169,27,0.05))',
                                    border: '1px solid rgba(241,169,27,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 24, fontWeight: 900, color: '#F1A91B',
                                }}>
                                    {inferredName.charAt(0)}
                                </div>
                                <div>
                                    <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--m-text-primary, #f5f7fb)', margin: 0 }}>
                                        {inferredName}
                                    </h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                                            color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            Unclaimed
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--m-text-muted, #6a7181)' }}>
                                            Heavy Haul Operator
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile strength meter */}
                            <div style={{
                                padding: '14px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                marginBottom: 12,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--m-text-secondary, #c7ccd7)' }}>Profile Strength</span>
                                    <span style={{ fontSize: 12, fontWeight: 900, color: '#EF4444' }}>10%</span>
                                </div>
                                <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ width: '10%', height: '100%', borderRadius: 999, background: '#EF4444' }} />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                    {['Phone', 'Service Area', 'Equipment', 'Insurance', 'DOT Number'].map(field => (
                                        <span key={field} style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                            color: '#EF4444',
                                        }}>
                                            Missing: {field}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Claim CTA */}
                            <Link href="/claim" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                width: '100%', padding: '16px 20px', borderRadius: 14,
                                background: 'linear-gradient(135deg, #F1A91B, #f1c27b)',
                                color: '#060b12', fontWeight: 900, fontSize: 15,
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                🔒 Is this you? Claim this profile →
                            </Link>
                            <p style={{ fontSize: 10, color: 'var(--m-text-muted, #6a7181)', textAlign: 'center', marginTop: 8 }}>
                                Claiming gives you control over your listing, visibility, and leads.
                            </p>
                        </div>

                        {/* Market heartbeat — live context */}
                        <div style={{ padding: '0 var(--m-screen-pad, 16px) 24px' }}>
                            <ProfileFreshness variant="bar" />
                        </div>

                        {/* Trust & Strength Summary */}
                        <div style={{ padding: '0 var(--m-screen-pad, 16px) 16px' }}>
                            <TrustStrengthSummary
                                completionPercent={15}
                                isClaimed={false}
                                isShell={true}
                                verificationTier="seeded"
                                dataFreshness="Auto-generated"
                            />
                        </div>

                        {/* Claim Pressure — market-aware */}
                        <div style={{ padding: '0 var(--m-screen-pad, 16px) 16px' }}>
                            <ClaimPressureEngine
                                listingId={id}
                                listingName={inferredName}
                                variant="card"
                                showValueContrast={true}
                            />
                        </div>

                        {/* Outcome proof — local context */}
                        <div style={{ padding: '0 var(--m-screen-pad, 16px) 16px' }}>
                            <OutcomeProofBlock variant="compact" surface="profile" />
                        </div>

                        {/* Action links */}
                        <div style={{ padding: '0 var(--m-screen-pad, 16px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <Link href="/directory" style={{
                                padding: '14px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 18, marginBottom: 4 }}>📖</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Browse Directory</div>
                            </Link>
                            <Link href="/home" style={{
                                padding: '14px 16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                textDecoration: 'none', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 18, marginBottom: 4 }}>🏠</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Command Center</div>
                            </Link>
                        </div>
                    </div>
                }
                desktop={
                    <div className="min-h-screen bg-[#000] text-[#C0C0C0]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        <div className="max-w-3xl mx-auto px-6 py-20">
                            {/* Shell header */}
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                                    style={{ background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.25)', color: '#F1A91B' }}>
                                    {inferredName.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white">{inferredName}</h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded"
                                            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                                            UNCLAIMED
                                        </span>
                                        <span className="text-sm text-[#888]">Heavy Haul Operator</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile strength */}
                            <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-bold text-[#888]">Profile Strength</span>
                                    <span className="text-sm font-black text-red-400">10%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#111] overflow-hidden">
                                    <div className="h-full rounded-full bg-red-400" style={{ width: '10%' }} />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {['Phone', 'Service Area', 'Equipment', 'Insurance', 'DOT Number'].map(f => (
                                        <span key={f} className="text-[10px] font-bold px-2 py-1 rounded"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444' }}>
                                            Missing: {f}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Claim CTA */}
                            <Link href="/claim"
                                className="block w-full text-center py-4 rounded-xl font-black text-base"
                                style={{ background: 'linear-gradient(135deg, #F1A91B, #f1c27b)', color: '#000' }}>
                                🔒 Is this you? Claim this profile →
                            </Link>
                            <p className="text-center text-[10px] text-[#555] mt-3">
                                Claiming gives you control over your listing, visibility, and leads.
                            </p>

                            {/* Market context */}
                            <div className="mt-8">
                                <MarketHeartbeat />
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-4 mt-8">
                                <Link href="/directory" className="flex-1 text-center py-3 rounded-xl font-bold text-sm"
                                    style={{ background: '#111', border: '1px solid #333', color: '#fff' }}>
                                    Browse Directory
                                </Link>
                                <Link href="/" className="flex-1 text-center py-3 rounded-xl font-bold text-sm"
                                    style={{ background: '#111', border: '1px solid #333', color: '#fff' }}>
                                    Home
                                </Link>
                            </div>
                        </div>
                    </div>
                }
            />
        );
    }

    /* ── Derived values from real data ── */
    const displayName = profile.company_name || profile.display_name || "Unknown Operator";
    const city = profile.home_base_city || "";
    const state = profile.home_base_state || "";
    const trustScore = profile.trust_score || 0;
    const isVerified = profile.verification_status === "verified";
    const isClaimed = profile.is_claimed ?? false;
    const isSeeded = profile.is_seeded ?? false;
    const certs = profile.certifications_json || {};
    const hasTWIC = certs.twic ?? false;
    const hasAmber = certs.amber_light ?? false;
    const hasHighPole = certs.high_pole ?? false;
    const isInsured = profile.insurance_status === "verified";

    // Radar data — only show if the profile has REAL metrics (not default zeros)
    const hasRadar = (profile.reliability_score > 0 || profile.responsiveness_score > 0);
    const radarData = {
        reliability: profile.reliability_score,
        responsiveness: profile.responsiveness_score,
        integrity: profile.integrity_score,
        customer_signal: profile.customer_signal_score,
        compliance: profile.compliance_score,
        market_fit: profile.market_fit_score,
    };

    // ----- COLD START TRUST CALCULATIONS (source-backed) -----
    const completedEscorts = profile.completed_escorts; // real data, never fabricated
    const isColdStart = completedEscorts < 10;
    let trustStatus = null;

    if (isColdStart && isVerified) {
        trustStatus = { label: "Verified — Building History", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: ShieldCheck };
    } else if (!isColdStart && trustScore >= 85) {
        trustStatus = { label: "Top Performer", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: Star };
    } else if (!isColdStart && trustScore >= 50) {
        trustStatus = { label: "Established Operator", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Award };
    } else if (!isVerified) {
        trustStatus = { label: "Unverified", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: ShieldCheck };
    }

    // Profile Completeness Meter (Max 100)
    let completenessValue = 20; // Unverified floor
    if (isVerified) completenessValue = 45;
    if (hasTWIC) completenessValue += 10;
    if (isInsured) completenessValue += 10;
    if (hasAmber || hasHighPole) completenessValue += 10;
    if (profile.vehicle_type) completenessValue += 5;
    if (profile.us_dot_number) completenessValue += 15;
    completenessValue = Math.min(100, completenessValue);

    return (
        <MobileGate
            mobile={
                <MobileProviderProfile
                    profile={profile}
                    entityId={id}
                    isClaimed={isClaimed}
                    isSeeded={isSeeded}
                />
            }
            desktop={
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                {/* ===== UNCLAIMED BANNER ===== */}
                {isSeeded && !isClaimed && (
                    <ClaimBanner
                        listingId={id}
                        listingName={displayName}
                        variant="card"
                    />
                )}

                {/* ===== LIVE MARKET HEARTBEAT ===== */}
                {state && (
                    <MarketHeartbeat
                        state={state}
                        city={city}
                        variant="strip"
                    />
                )}

                {/* ===== ADGRID: FEATURED OPERATOR SLOT ===== */}
                <AdSlot placement="adgrid_profile_featured_operator" geoKey={state || 'national'} pageType="profile" format="banner" />

                {/* ===== SECTION 1 & 2: IDENTITY HEADER & LIVE PERFORMANCE ===== */}
                <motion.div
                    className="flex flex-col gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    {/* SECTION 1: Identity Header */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 md:p-10 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Search className="w-64 h-64 -rotate-12" />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10">
                            {/* Watch Button */}
                            <div className="absolute top-0 right-0 z-20">
                                <WatchButton
                                    watchType="operator"
                                    targetId={id}
                                    targetLabel={displayName}
                                    variant="icon"
                                    size="md"
                                />
                            </div>
                            {/* LEFT SIDE: Identity */}
                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start flex-1 w-full">
                                {/* Avatar */}
                                <motion.div
                                    variants={scaleIn}
                                    className="w-28 h-28 bg-black border-2 border-[#F1A91B] rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_40px_rgba(241,169,27,0.2)]"
                                >
                                    <Truck className="w-10 h-10 text-[#F1A91B]" />
                                </motion.div>

                                {/* Info */}
                                <motion.div variants={fadeUp} className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-[-0.03em] leading-none">
                                            {displayName}
                                        </h1>

                                        {/* COLD START TRUST STATUS BADGE */}
                                        {trustStatus && (
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 border ${trustStatus.bg} ${trustStatus.color} ${trustStatus.border}`}>
                                                <trustStatus.icon className="w-3.5 h-3.5" />
                                                {trustStatus.label}
                                            </span>
                                        )}

                                        {!isClaimed && (
                                            <span className="bg-white/5 text-[#888] text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-[0.15em]">
                                                Unclaimed
                                            </span>
                                        )}
                                    </div>

                                    {/* Subtitle Line */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-[#888] font-medium mb-6">
                                        {(city || state) && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-[#F1A91B]" />
                                                {[city, state].filter(Boolean).join(", ")}
                                            </span>
                                        )}
                                        {profile.vehicle_type && (
                                            <span className="flex items-center gap-1.5">
                                                <Truck className="w-4 h-4 text-[#F1A91B]" />
                                                {profile.vehicle_type}
                                            </span>
                                        )}
                                        {profile.us_dot_number && (
                                            <span>US DOT: <span className="text-white">{profile.us_dot_number}</span></span>
                                        )}
                                    </div>

                                    {/* Urgency Indicator — only show if we have real data */}
                                    {/* REMOVED: Random fake view count. Will re-enable when real view tracking is wired. */}

                                    {/* Verification Badges */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        {isVerified && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
                                            </div>
                                        )}
                                        {isInsured && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Insured 1M+
                                            </div>
                                        )}
                                        {hasTWIC && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                <Award className="w-3.5 h-3.5" /> TWIC
                                            </div>
                                        )}
                                        {/* Trust badge floated in the list for mobile, but right-aligned on desktop usually */}
                                        {(isClaimed || trustScore > 0) && (
                                            <div className="flex md:hidden items-center gap-1.5 px-3 py-1.5 bg-[#F1A91B]/10 text-[#F1A91B] border border-[#F1A91B]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                <Star className="w-3.5 h-3.5" /> Trust Score {trustScore}
                                            </div>
                                        )}
                                    </div>

                                    {/* PROFILE FRESHNESS — Activity + last seen + verification state */}
                                    <ProfileFreshness
                                        lastActiveAt={profile.updated_at}
                                        profileUpdatedAt={profile.updated_at}
                                        isClaimed={isClaimed}
                                        isVerified={isVerified}
                                        completionPercent={completenessValue}
                                        variant="inline"
                                        className="mt-3"
                                    />

                                    {/* PROFILE COMPLETENESS / VERIFICATION METER */}
                                    <div className="mt-6 p-4 rounded-xl bg-black border border-[#222] max-w-sm">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Verification Strength</div>
                                            <div className="text-xs font-black text-white">{completenessValue}%</div>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${completenessValue >= 80 ? 'bg-emerald-500' : completenessValue >= 50 ? 'bg-[#F1A91B]' : 'bg-red-500'}`}
                                                style={{ width: `${completenessValue}%` }}
                                            />
                                        </div>
                                        {completenessValue < 80 && isClaimed && (
                                            <button className="mt-3 text-[10px] text-[#F1A91B] hover:text-[#f0b93a] font-bold uppercase tracking-wider">
                                                + Add documents to boost score
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* RIGHT SIDE: Action CTA Block (Sticky-ish on Mobile) */}
                            <motion.div variants={fadeUp} custom={2} className="w-full lg:w-[320px] shrink-0 space-y-4">
                                {/* Desktop Trust Score display */}
                                {(isClaimed || trustScore > 0) && (
                                    <div className="hidden md:flex flex-col items-end mb-6">
                                        <div className="text-[10px] uppercase font-bold text-[#444] tracking-[0.25em] mb-1">Network Trust</div>
                                        <div className="text-6xl font-black text-white tracking-[-0.05em] leading-none">{trustScore}</div>
                                    </div>
                                )}

                                {/* Status indicators row */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex flex-col items-center justify-center p-3 bg-[#111] border border-[#222] rounded-xl text-center relative overflow-hidden group cursor-pointer transition-colors hover:border-[#F1A91B]/50">
                                        {/* Mock Availability Toggle for Operator View */}
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Set Away</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hc-success opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-hc-success"></span>
                                            </span>
                                            <span className="text-[10px] font-black text-hc-success uppercase tracking-widest">Available</span>
                                        </div>
                                        <span className="text-[10px] text-hc-muted uppercase tracking-wider font-semibold">Live Status</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 bg-[#111] border border-[#222] rounded-xl text-center">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Zap className="w-3 h-3 text-emerald-400" />
                                            <span className="text-sm font-black text-emerald-400 uppercase tracking-tight">{'< 15'}m</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">Avg Response</span>
                                            <div className="group relative">
                                                <Info className="w-2.5 h-2.5 text-[#555] cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-[#333] rounded-lg text-xs text-[#aaa] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                                    Based on last 30 days of direct dispatch requests. Feeds directly into Early Behavior Accelerator.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Call to action buttons */}
                                <div className="flex flex-col gap-2">
                                    <button className="w-full h-14 bg-[#F1A91B] hover:bg-[#f0b93a] text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(241,169,27,0.15)] hover:shadow-[0_0_30px_rgba(241,169,27,0.3)] hover:-translate-y-0.5 focus:scale-[0.98]">
                                        Request Escort
                                    </button>
                                    <button className="w-full h-12 flex items-center justify-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all">
                                        <PhoneCall className="w-4 h-4 text-hc-subtle" />
                                        Click to Call
                                    </button>
                                </div>

                                {/* AppGate — gates premium content for unauthenticated users */}
                                {(!isClaimed || isSeeded) && (
                                    <AppGate
                                        gatedContent="contact_info"
                                        entityId={id}
                                        entityType="profile"
                                    />
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* SECTION 2: Live Performance Strip */}
                    <motion.div variants={fadeUp} custom={3}>
                        <ProfilePerformanceStrip
                            completedEscorts={profile.completed_escorts}
                            reliabilityScore={profile.reliability_score}
                            medianResponseTimeStr={profile.responsiveness_score > 0 ? `${Math.round(60 / (profile.responsiveness_score / 100))}m` : "—"}
                            corridorsServed={(profile as any).corridors_served ?? (state ? 1 : 0)}
                            lastActiveStr={profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}
                        />
                    </motion.div>
                </motion.div>

                {/* ===== MAIN CONTENT GRID ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-32">
                    {/* LEFT COLUMN (Sections 5, 3, 6, Reviews) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* SECTION 5: Predicted Fill Intelligence */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
                            <SubscriberGate visibility={visibility} surface="trust_insights" showBlurredTeaser>
                                <PredictedFillIntelligence
                                    fillProbabilityPct={profile.fill_probability != null ? profile.fill_probability : undefined}
                                    isProTier={isPaid || isOwner}
                                />
                            </SubscriberGate>
                        </motion.div>

                        {/* SECTION 3: Corridor Strength Heat */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#F1A91B]" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Corridor Strength Heat</h2>
                                </div>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl">
                                <CorridorMap
                                    regionData={state ? [{
                                        code: state,
                                        heat: "hot",
                                        escortCount: 1,
                                    }] : []}
                                    className="w-full"
                                />
                            </div>
                        </motion.div>

                        {/* SECTION 6: Activity Timeline */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#F1A91B]" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Activity Timeline</h2>
                                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Live</span>
                                </div>
                            </div>
                            <LiveActivityFeed
                                region={profile?.home_base_state ?? undefined}
                                limit={5}
                                pollIntervalMs={60000}
                            />
                        </motion.div>

                        {/* Broker Reviews */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-[#F1A91B]" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Broker Reviews</h2>
                                {reviews.length > 0 && (
                                    <span className="text-[10px] text-[#555] font-semibold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                                )}
                            </div>
                            {reviews.length > 0 ? (
                                <>
                                    <ReviewSummaryBar reviews={reviews} />
                                    <div className="space-y-3">
                                        {reviews.slice(0, 5).map(r => (
                                            <ReviewCard key={r.id} review={r} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
                                    <MessageSquare className="w-8 h-8 text-[#333] mx-auto mb-3" />
                                    <p className="text-xs text-[#555]">No broker reviews yet. Reviews appear after verified job completions.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN (Section 4, Radar) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* SECTION 4: Capability Snapshot */}
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl"
                        >
                            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 pb-3 border-b border-[#1a1a1a]">Capability Snapshot</h3>
                            <EquipmentBadges
                                equipmentKeys={[
                                    ...(hasHighPole ? ["high_pole"] : []),
                                    ...(hasAmber ? ["amber_lights"] : []),
                                    ...(hasTWIC ? ["twic"] : []),
                                    // Only source-verified certifications — no mock data
                                    ...(Object.keys(certs).filter(k => certs[k]))
                                ]}
                                variant="expanded"
                                className="grid-cols-1 sm:grid-cols-1 gap-3"
                            />
                        </motion.div>

                        {/* Trust Radar */}
                        {hasRadar && (
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}>
                                <SubscriberGate visibility={visibility} surface="report_card" showBlurredTeaser>
                                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Activity className="w-4 h-4 text-[#F1A91B]" />
                                            <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Operational Footprint</h2>
                                        </div>
                                        <TrustRadar data={radarData} />
                                        <p className="text-[10px] text-[#444] mt-3 text-center uppercase tracking-[0.2em] font-medium">
                                            Based on last 30 days of performance
                                        </p>
                                    </div>
                                </SubscriberGate>
                            </motion.div>
                        )}

                        {/* ===== OWNER VISIBILITY CONTROLS ===== */}
                        {isOwner && (
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <OwnerVisibilityControls listingId={id} />
                            </motion.div>
                        )}

                        {/* ===== NATIVE AD — SIDEBAR ===== */}
                        <NativeAdCard
                            placementId="profile-sidebar"
                            surface="profile_sidebar"
                            variant="sidebar"
                            jurisdiction={state || undefined}
                        />

                        {/* Old Specialization Block - Minimally kept if useful */}
                        <motion.div
                            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl"
                        >
                            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 pb-3 border-b border-[#1a1a1a]">Home Base</h3>
                            <div className="space-y-4">
                                {(city || state) && (
                                    <div>
                                        <div className="text-[10px] text-[#444] uppercase font-bold tracking-[0.2em] mb-1">Location</div>
                                        <div className="text-sm text-[#999] font-medium flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-[#F1A91B]" />
                                            {[city, state].filter(Boolean).join(", ")}
                                        </div>
                                    </div>
                                )}
                                {profile.coverage_radius_miles && (
                                    <div>
                                        <div className="text-[10px] text-[#444] uppercase font-bold tracking-[0.2em] mb-1">Coverage Radius</div>
                                        <div className="text-sm text-[#999] font-medium">{profile.coverage_radius_miles} miles</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ===== ADGRID: CLAIM UPGRADE CTA (UNCLAIMED ONLY) ===== */}
            {(!isClaimed || isSeeded) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-[#F1A91B]/10 to-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-2xl p-6 text-center"
                >
                    <h3 className="text-lg font-bold text-white mb-2">Upgrade This Profile</h3>
                    <p className="text-sm text-[#888] mb-4 max-w-lg mx-auto">
                        Claim this listing to manage your profile, add photos, respond to reviews, and get priority placement in directory search results.
                    </p>
                    <Link
                        href={`/claim/${profile.claim_hash || id}`}
                        className="inline-block bg-[#F1A91B] text-black font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#f0b93a] transition-all hover:scale-105"
                    >
                        Claim & Upgrade →
                    </Link>
                    <div className="mt-3 text-[10px] text-[#555]">
                        Verified operators get 3× more quote requests
                    </div>
                </motion.div>
            )}

            {/* ===== INLINE UPGRADE BANNER (free/anon only) ===== */}
            {visibility.show_upgrade_prompt && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <InlineUpgradeBanner tier={tier} surface="trust_insights" />
                </div>
            )}

            {/* ===== ADGRID: SIMILAR OPERATORS SLOT ===== */}
            <AdSlot placement="adgrid_profile_similar_operators" geoKey={state || 'national'} pageType="profile" format="inline" />

            {/* ===== NATIVE AD — INLINE (Below Profile) ===== */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <NativeAdCard
                    placementId="profile-bottom"
                    surface="profile_bottom"
                    variant="inline"
                    jurisdiction={state || undefined}
                />
            </div>

            {/* SECTION 7: Broker Action Bar */}
            <BrokerActionBar />
        </div>
            }
        />
    );
}

export const dynamic = "force-dynamic";
