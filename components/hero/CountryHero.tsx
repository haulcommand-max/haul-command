"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Navigation, Truck, Shield, Users, Map } from "lucide-react";
import { shouldPlayVideo } from "@/lib/hero/shouldPlayVideo";
import type { HeroPack } from "./heroPacks";
import HeroSearchBar from "./HeroSearchBar";

type Props = {
    pack: HeroPack;
    /** When true, shows escort/broker role buttons instead of pack CTA */
    showRoleButtons?: boolean;
    /** When true (default), shows inline search bar at bottom of hero */
    showSearch?: boolean;
    /** Proof pills from global stats */
    totalOperators?: number;
    totalCorridors?: number;
    totalCountries?: number;
    liveCountries?: number;
};

export default function CountryHero({
    pack,
    showRoleButtons = true,
    showSearch = true,
    totalOperators = 0,
    totalCorridors = 0,
    totalCountries = 120,
    liveCountries = 2,
}: Props) {
    const [canVideo, setCanVideo] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const hostRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const poster = useMemo(
        () => ({
            avif: `${pack.posterBase}.avif`,
            webp: `${pack.posterBase}.webp`,
            jpg: `${pack.posterBase}.jpg`,
        }),
        [pack.posterBase]
    );

    const video = useMemo(
        () => ({
            webm: `${pack.videoBase}.webm`,
            mp4: `${pack.videoBase}.mp4`,
            webmMobile: `${pack.videoBase}-mobile.webm`,
            mp4Mobile: `${pack.videoBase}-mobile.mp4`,
        }),
        [pack.videoBase]
    );

    // Viewport gate
    useEffect(() => {
        const el = hostRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) setInView(true);
                }
            },
            { rootMargin: "200px 0px" }
        );

        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Video capability check — after first paint
    useEffect(() => {
        const id = window.requestAnimationFrame(() => {
            setCanVideo(shouldPlayVideo());
        });
        return () => window.cancelAnimationFrame(id);
    }, []);

    const playVideo = canVideo && inView;

    // Play video when ready
    useEffect(() => {
        if (playVideo && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay blocked — poster remains visible
                setCanVideo(false);
            });
        }
    }, [playVideo]);

    const showVideo = playVideo && videoLoaded;

    return (
        <section
            ref={hostRef}
            className="hc-hero relative isolate overflow-hidden"
            id="hero"
        >
            {/* FIX #18: Reduced hero height ~20% — brings value above fold faster */}
            <div className="relative w-full" style={{
                height: 'clamp(380px, 55vh, 750px)',
                maxHeight: '60vh',
            }}>
                {/* ── POSTER (LCP element) ── */}
                <picture>
                    <source srcSet={poster.avif} type="image/avif" />
                    <source srcSet={poster.webp} type="image/webp" />
                    <Image
                        src={poster.jpg}
                        alt=""
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover transition-opacity duration-700 hero-bg-image"
                        style={{
                            opacity: showVideo ? 0 : 1,
                            objectPosition: '40% center',
                        }}
                    />
                </picture>

                {/* ── Ken Burns subtle motion when no video ── */}
                {!showVideo && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage: `url(${poster.webp})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.12,
                            mixBlendMode: "overlay",
                            animation: "heroKenBurns 18s ease-in-out infinite",
                        }}
                    />
                )}

                {/* ── VIDEO (lazy, only when allowed) ── */}
                {playVideo && (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                        style={{ opacity: videoLoaded ? 1 : 0 }}
                        muted
                        playsInline
                        loop
                        preload="none"
                        poster={poster.jpg}
                        onCanPlayThrough={() => setVideoLoaded(true)}
                    >
                        <source
                            src={video.webmMobile}
                            type="video/webm"
                            media="(max-width: 768px)"
                        />
                        <source
                            src={video.mp4Mobile}
                            type="video/mp4"
                            media="(max-width: 768px)"
                        />
                        <source src={video.webm} type="video/webm" />
                        <source src={video.mp4} type="video/mp4" />
                    </video>
                )}

                {/* FIX #05: 3-stop gradient for consistent text readability */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.72) 50%, rgba(0,0,0,0.88) 100%)',
                    }}
                />

                {/* ── Amber accent glow ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(198,146,58,0.08), transparent 60%)",
                    }}
                />

                {/* ── Content ── */}
                <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-6 py-12 text-center">
                    {/* Readability Plate */}
                    <div className="hc-hero-copy w-full max-w-3xl mx-auto">
                        {/* Live badge */}
                        <div className="mb-5 flex justify-center">
                            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#C6923A]/20 bg-[#C6923A]/[0.06] px-5 py-2.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C6923A] opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C6923A]" />
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C6923A]">
                                    Live Matching Active
                                </span>
                            </div>
                        </div>

                        {/* FIX #04: Headline — forced 2-line layout, balanced wrap */}
                        <h1
                            className="mx-auto max-w-4xl text-white"
                            style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 'clamp(1.75rem, 5vw, 4rem)',
                                fontWeight: 900,
                                lineHeight: 1.08,
                                letterSpacing: '-0.03em',
                                textWrap: 'balance' as any,
                            }}
                        >
                            {pack.title}
                        </h1>

                        {/* FIX #07: Tagline copy — max 65ch line length for mobile readability */}
                        <p className="mx-auto mt-4 text-white/75"
                            style={{
                                fontSize: 'clamp(0.875rem, 2.2vw, 1.125rem)',
                                fontWeight: 500,
                                lineHeight: 1.65,
                                maxWidth: '50ch',
                            }}
                        >
                            {pack.subtitle}
                        </p>

                        {/* FIX #19: Proof pills — trust stats immediately visible */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            {totalOperators > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
                                    <Users className="w-3 h-3 text-emerald-400" />
                                    {totalOperators.toLocaleString()} Verified Operators
                                </span>
                            )}
                            {totalCorridors > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
                                    <Map className="w-3 h-3 text-purple-400" />
                                    {totalCorridors} Live Corridors
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
                                <Shield className="w-3 h-3 text-amber-400" />
                                {liveCountries}/{totalCountries} Countries Live
                            </span>
                        </div>

                        {/* FIX #08: CTAs — BROKER primary (gold), Escort secondary */}
                        <div className="mt-6 flex flex-col items-center gap-3">
                            {showRoleButtons ? (
                                <>
                                    {/* PRIMARY: Broker — brings the loads */}
                                    <Link
                                        href="/onboarding/start?role=broker"
                                        className="hc-btn hc-btn--gold group w-full"
                                        style={{ maxWidth: 400 }}
                                    >
                                        <Truck className="h-4 w-4" />
                                        <span className="hc-btn__label">Post a Load</span>
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>

                                    {/* SECONDARY: Escort */}
                                    <Link
                                        href="/onboarding/start?role=escort"
                                        className="hc-btn hc-btn--black group w-full"
                                        style={{ maxWidth: 400 }}
                                    >
                                        <Navigation className="h-4 w-4" />
                                        <span className="hc-btn__label">Find Loads</span>
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>

                                    {/* FIX #09: Premium microcopy */}
                                    <span className="text-[11px] font-medium text-white/25">
                                        Choose your role to get started
                                    </span>
                                </>
                            ) : (
                                <Link
                                    href={pack.ctaHref}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-black transition-all"
                                    style={{
                                        minHeight: 56,
                                        background: "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)",
                                        boxShadow: "0 4px 24px rgba(198,146,58,0.3)",
                                    }}
                                >
                                    {pack.ctaLabel}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    </div> {/* End Readability Plate */}

                    {/* ── P0.1: Inline Search Bar (Truckstop pattern) ── */}
                    {showSearch && (
                        <div className="mt-8 w-full max-w-4xl mx-auto">
                            <HeroSearchBar />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Keyframes ── */}
            <style jsx global>{`
                @keyframes heroKenBurns {
                    0% { transform: scale(1) translate3d(0, 0, 0); }
                    50% { transform: scale(1.06) translate3d(-1.5%, -1.5%, 0); }
                    100% { transform: scale(1) translate3d(0, 0, 0); }
                }
            `}</style>
        </section>
    );
}
