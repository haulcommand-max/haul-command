"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign, Zap, MapPin, TrendingUp, Star, Shield,
  ArrowRight, Smartphone, Award, Route, Bell, BarChart3,
} from "lucide-react";

/* =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•
   WHY OPERATORS JOIN HAUL COMMAND
   =”€ Direct counter to ODS "Join Our Network" page.
     ODS says: "free to join, guaranteed pay, paid fast, 
     more miles, minimize deadhead."
     HC says the same + 12 money-making surfaces they can't match.
   =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=• */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const OPERATOR_HOOKS = [
  {
    icon: DollarSign,
    title: "Get Paid Same Day",
    desc: "Fast pay or instant payout via Stripe. No invoicing, no chasing, no waiting 30+ days.",
    accent: "#22c55e",
    badge: null,
  },
  {
    icon: Zap,
    title: "One-Tap Accept",
    desc: "Receive push offers filtered to your equipment and territory. Accept in one tap. Go.",
    accent: "#3b82f6",
    badge: null,
  },
  {
    icon: MapPin,
    title: "Less Deadhead, More Miles",
    desc: "Our return-load matching engine finds your next job before you finish the current one.",
    accent: "#F59E0B",
    badge: "SMART",
  },
  {
    icon: TrendingUp,
    title: "See Your Earnings Grow",
    desc: "Your earnings counter, job history, and demand alerts — all visible in your dashboard.",
    accent: "#a855f7",
    badge: null,
  },
  {
    icon: Star,
    title: "Build Your Reputation",
    desc: "Every completed job earns trust points. High-trust operators get priority loads and premium rates.",
    accent: "#f59e0b",
    badge: null,
  },
  {
    icon: Shield,
    title: "Claim Your Profile",
    desc: "Claim your free public profile. Show your equipment, coverage area, certifications, and reviews.",
    accent: "#06b6d4",
    badge: "FREE",
  },
  {
    icon: Bell,
    title: "Territory Demand Alerts",
    desc: "Subscribe to corridors. Get notified when demand spikes in your area before anyone else.",
    accent: "#ef4444",
    badge: null,
  },
  {
    icon: Route,
    title: "Corridor Subscriptions",
    desc: "Lock in your preferred routes. Our algorithm prioritizes corridor-subscribed operators first.",
    accent: "#8b5cf6",
    badge: "$19/mo",
  },
  {
    icon: Award,
    title: "Preferred Operator Status",
    desc: "Top-ranked operators get a gold badge, priority dispatch queue, and higher visibility in the directory.",
    accent: "#C6923A",
    badge: null,
  },
  {
    icon: BarChart3,
    title: "Availability Heatmap",
    desc: "Your live availability broadcasts to every carrier and broker searching your territory. More visibility = more jobs.",
    accent: "#10b981",
    badge: null,
  },
  {
    icon: Smartphone,
    title: "Free to Join, Free to Use",
    desc: "No membership fees. No sign-up costs. Create your profile, toggle available, and start earning today.",
    accent: "#6366f1",
    badge: "FREE",
  },
  {
    icon: DollarSign,
    title: "Escrow-Protected Payments",
    desc: "Every job runs through escrow. Funds release on confirmed completion. Your money is always safe.",
    accent: "#14b8a6",
    badge: null,
  },
];

export function WhyOperatorsJoin() {
  return (
    <section className="relative z-10 py-12 sm:py-20">
      <div className="hc-container max-w-6xl">
        {/* Header */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-8 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
              For Pilot Car & Escort Operators
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Why Operators Join Haul Command
          </h2>
          <p className="text-sm sm:text-base text-[#8fa3b8] max-w-2xl mx-auto leading-relaxed">
            More jobs. Better pay. Less deadhead. Free to join. The app that makes you money — not just lists your name.
          </p>
        </motion.div>

        {/* Hook Grid */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {OPERATOR_HOOKS.map(({ icon: Icon, title, desc, accent, badge }, i) => (
            <motion.div
              key={title} custom={i} variants={fadeUp}
              className="group relative rounded-2xl border border-white/[0.06] overflow-hidden cursor-default"
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: 'clamp(14px, 2.5vw, 20px)',
                transition: 'border-color 0.3s, background 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${accent}30`;
                (e.currentTarget as HTMLElement).style.background = `${accent}06`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              {badge && (
                <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
                  {badge}
                </span>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}18` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: accent, width: 18, height: 18 }} />
              </div>
              <h3 className="font-bold text-white text-[13px] mb-1">{title}</h3>
              <p className="text-[#8fa3b8] text-[11px] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="mt-6 sm:mt-8 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-5 sm:p-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04]">
            <div className="text-center sm:text-left">
              <div className="text-sm font-bold text-white mb-0.5">Ready to earn more?</div>
              <div className="text-[11px] text-[#8fa3b8]">
                Join 15,000+ operators already on the platform. Free forever.
              </div>
            </div>
            <Link
              aria-label="Join as an operator"
              href="/onboarding/start?role=operator"
              className="inline-flex items-center gap-2 text-xs font-bold text-white px-6 py-3 rounded-xl transition-all flex-shrink-0 press-scale"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #22c55e 100%)",
                boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
              }}
            >
              Join Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}