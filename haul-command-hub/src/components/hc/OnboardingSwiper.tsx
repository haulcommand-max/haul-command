"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   ONBOARDING SWIPER — Apple-Style Animated Registration
   
   Replaces boring forms with a smooth touch-swipe carousel.
   Each slide is a full-screen step with micro-animations.
   Designed to slash bounce rates by 60%+
   ═══════════════════════════════════════════════════════════ */

interface OnboardingSlide {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: "🌎",
    title: "Global Coverage",
    subtitle: "57 Countries. One Platform.",
    description:
      "Haul Command is the world's largest pilot car and escort vehicle network. Find verified operators anywhere on the planet.",
    bgGradient: "from-blue-900/20 via-transparent to-transparent",
  },
  {
    icon: "⚡",
    title: "Instant Dispatch",
    subtitle: "Post a load. Get escorts in minutes.",
    description:
      "Our AI-powered surge engine matches you with the nearest qualified escort. Real-time availability. Zero phone tag.",
    bgGradient: "from-accent/10 via-transparent to-transparent",
  },
  {
    icon: "🛡️",
    title: "Verified Trust",
    subtitle: "Every operator. Background checked.",
    description:
      "Operational Report Cards, peer endorsements, and DOT verification ensure you're working with professionals, not strangers.",
    bgGradient: "from-green-900/20 via-transparent to-transparent",
  },
  {
    icon: "💰",
    title: "Get Paid Faster",
    subtitle: "Stripe Connect. Same-day payouts.",
    description:
      "No more net-30 invoicing headaches. Accept jobs, complete the run, get paid instantly through our secure payment rail.",
    bgGradient: "from-purple-900/20 via-transparent to-transparent",
  },
  {
    icon: "🚀",
    title: "Ready to Command?",
    subtitle: "Join 7,800+ operators worldwide.",
    description:
      "Claim your free profile in 60 seconds. No credit card required. Upgrade to Pro anytime to unlock priority dispatch.",
    bgGradient: "from-accent/15 via-transparent to-transparent",
  },
];

export function OnboardingSwiper() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = SLIDES.length;
  const isLastSlide = currentSlide === totalSlides - 1;

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating || idx < 0 || idx >= totalSlides) return;
      setIsAnimating(true);
      setCurrentSlide(idx);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, totalSlides]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  // Auto-advance every 6s, paused on touch
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      if (!isLastSlide) {
        goTo(currentSlide + 1);
      }
    }, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentSlide, isLastSlide, goTo]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const onTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta > 60) prev();
    else if (touchDelta < -60) next();
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const slide = SLIDES[currentSlide];

  return (
    <div
      ref={containerRef}
      className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient} transition-all duration-700 ease-out`}
      />

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Slide content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg mx-auto transition-all duration-500 ease-out"
        style={{
          transform: `translateX(${touchDelta * 0.3}px)`,
          opacity: Math.max(0.3, 1 - Math.abs(touchDelta) / 300),
        }}
      >
        {/* Huge animated icon */}
        <div
          className="text-7xl sm:text-8xl mb-8 transition-transform duration-500 ease-out"
          style={{
            animationName: "onboarding-icon-float",
            animationDuration: "3s",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }}
        >
          {slide.icon}
        </div>

        {/* Title */}
        <h1
          key={`title-${currentSlide}`}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-3 animate-[onboarding-fade-up_0.5s_ease-out]"
        >
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p
          key={`sub-${currentSlide}`}
          className="text-accent font-bold text-lg sm:text-xl mb-4 animate-[onboarding-fade-up_0.5s_ease-out_0.1s_both]"
        >
          {slide.subtitle}
        </p>

        {/* Description */}
        <p
          key={`desc-${currentSlide}`}
          className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm animate-[onboarding-fade-up_0.5s_ease-out_0.2s_both]"
        >
          {slide.description}
        </p>

        {/* CTA on last slide */}
        {isLastSlide && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto animate-[onboarding-fade-up_0.5s_ease-out_0.3s_both]">
            <Link
              href="/claim"
              className="bg-accent text-black px-8 py-4 rounded-2xl font-black text-base hover:bg-yellow-500 transition-all shadow-[0_0_30px_rgba(245,159,10,0.3)] hover:shadow-[0_0_50px_rgba(245,159,10,0.5)] hover:scale-105 active:scale-95 text-center"
            >
              Claim Free Profile →
            </Link>
            <Link
              href="/login"
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-all text-center"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === currentSlide
                ? "w-8 h-2.5 bg-accent shadow-[0_0_12px_rgba(245,159,10,0.6)]"
                : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows (desktop) */}
      {currentSlide > 0 && (
        <button
          onClick={prev}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-12 h-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all hover:scale-110"
          aria-label="Previous"
        >
          ←
        </button>
      )}
      {!isLastSlide && (
        <button
          onClick={next}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 hidden sm:flex w-12 h-12 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all hover:scale-110"
          aria-label="Next"
        >
          →
        </button>
      )}

      {/* Skip link */}
      {!isLastSlide && (
        <button
          onClick={() => goTo(totalSlides - 1)}
          className="absolute top-6 right-6 z-20 text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
        >
          Skip →
        </button>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes onboarding-fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes onboarding-icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
