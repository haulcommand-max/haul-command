"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Clock, Globe, FileCheck, Headphones, BadgeCheck,
  ArrowRight, CreditCard, Route, Users, CheckCircle,
} from "lucide-react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WHY CARRIERS CHOOSE HAUL COMMAND
   â”€ Direct ODS-killer section. Their pitch: "easy, safe, 
     insured, nationwide." Ours adds software, intelligence,
     global scale, and self-serve tooling.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const CARRIER_BENEFITS = [
  {
    icon: Globe,
    title: "120-Country Coverage",
    desc: "Not just North America. Find verified escorts in any country where heavy haul runs.",
    accent: "#3b82f6",
  },
  {
    icon: Clock,
    title: "Dispatch in Under 4 Minutes",
    desc: "Post your load, our algorithm matches the nearest qualified escort. Average fill: 3.8 minutes.",
    accent: "#22c55e",
  },
  {
    icon: Shield,
    title: "Every Escort Verified",
    desc: "$1M+ insurance verified on file. COI vault. State certifications confirmed before dispatch.",
    accent: "#F59E0B",
  },
  {
    icon: CreditCard,
    title: "Consolidated Invoicing",
    desc: "One invoice per project. Multi-escort, multi-state, multi-day — all consolidated. No billing chaos.",
    accent: "#a855f7",
  },
  {
    icon: Route,
    title: "Route Intelligence Built In",
    desc: "Bridge clearances, weight limits, construction zones, permit requirements — checked before you dispatch.",
    accent: "#ef4444",
  },
  {
    icon: FileCheck,
    title: "Compliance Automation",
    desc: "Escort requirements auto-checked for every state on the route. Never get fined for a missing vehicle.",
    accent: "#06b6d4",
  },
  {
    icon: Headphones,
    title: "24/7 Command Center",
    desc: "Live dispatch support around the clock. Urgent? Our rescue layer activates in under 15 minutes.",
    accent: "#f43f5e",
  },
  {
    icon: Users,
    title: "One Point of Contact",
    desc: "Your dedicated coordinator manages the entire escort package. You focus on the load, we handle the rest.",
    accent: "#8b5cf6",
  },
];

export function WhyCarriersChoose() {
  return (
    <section className="relative z-10 py-12 sm:py-20">
      <div className="hc-container max-w-6xl">
        {/* Header */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-8 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-[#C6923A]/20 bg-[#C6923A]/[0.06]">
            <BadgeCheck className="w-3.5 h-3.5 text-[#C6923A]" />
            <span className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
              For Carriers & Brokers
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Why Carriers Choose Haul Command
          </h2>
          <p className="text-sm sm:text-base text-[#8fa3b8] max-w-2xl mx-auto leading-relaxed">
            The world's largest pilot escort network, directory, and route intelligence system.
            Find escorts, verify coverage, plan routes, and manage every move from one place.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {CARRIER_BENEFITS.map(({ icon: Icon, title, desc, accent }, i) => (
            <motion.div
              key={title} custom={i} variants={fadeUp}
              className="group relative rounded-2xl border border-white/[0.06] overflow-hidden cursor-default"
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: 'clamp(16px, 3vw, 24px)',
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}20` }}>
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
              <p className="text-[#8fa3b8] text-xs leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Differentiator bar */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl border border-white/[0.06]"
          style={{ background: 'rgba(255,255,255,0.015)' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[#8fa3b8]">
              {[
                { label: "North America's largest convoy is still just a subset of our network", icon: CheckCircle, color: "#22c55e" },
                { label: "Self-serve dispatch — no phone calls required", icon: CheckCircle, color: "#3b82f6" },
                { label: "Insurance verified before every dispatch", icon: CheckCircle, color: "#F59E0B" },
              ].map(({ label, icon: I, color }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <I className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                  <span>{label}</span>
                </span>
              ))}
            </div>
            <Link
              aria-label="Get started as a carrier"
              href="/onboarding/start?role=carrier"
              className="inline-flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition-all flex-shrink-0 press-scale"
              style={{
                background: "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)",
                boxShadow: '0 4px 16px rgba(198,146,58,0.25)',
              }}
            >
              Get Started Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}