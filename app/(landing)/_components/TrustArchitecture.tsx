"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Award, Clock, CheckCircle, Star, Fingerprint,
  ArrowRight, Search, BarChart3, FileCheck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   TRUST ARCHITECTURE SECTION
   ─ ODS says "trust us" with testimonials and logos.
     HC shows the score: verified insurance, certifications,
     response speed, completion count, trust score, real-time
     structured trust that a brokerage cannot replicate.
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const TRUST_METRICS = [
  { icon: Shield, label: "Insurance Verified", value: "COI on File", color: "#22c55e" },
  { icon: Award, label: "Certifications", value: "CEVO • CSE • State", color: "#F59E0B" },
  { icon: Clock, label: "Avg Response", value: "< 4 min", color: "#3b82f6" },
  { icon: Star, label: "Completion Rate", value: "97.3%", color: "#a855f7" },
  { icon: BarChart3, label: "Trust Score", value: "Calculated Live", color: "#C6923A" },
  { icon: Fingerprint, label: "Identity Verified", value: "Government ID", color: "#06b6d4" },
];

const PARTNER_LOGOS = [
  { name: "SC&RA", label: "Specialized Carriers & Rigging Association" },
  { name: "OOIDA", label: "Owner-Operator Independent Drivers Association" },
  { name: "TCA", label: "Truckload Carriers Association" },
  { name: "ATA", label: "American Trucking Associations" },
  { name: "FMCSA", label: "Federal Motor Carrier Safety Admin" },
  { name: "DOT", label: "Department of Transportation" },
];

export function TrustArchitecture() {
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
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
              Verified Trust System
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            We Don't Ask You to Trust Us.<br className="hidden sm:block" />
            <span style={{ color: '#C6923A' }}>We Show You the Score.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#8fa3b8] max-w-2xl mx-auto leading-relaxed">
            Every operator on Haul Command has a live trust report card. Insurance verified. Certifications confirmed. 
            Performance measured. No guesswork — just data.
          </p>
        </motion.div>

        {/* Trust Metrics Grid */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-8"
        >
          {TRUST_METRICS.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label} custom={i} variants={fadeUp}
              className="text-center p-3 sm:p-4 rounded-xl border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto"
                style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">{label}</div>
              <div className="text-xs font-bold text-white">{value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mock Report Card Preview */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl border border-[#C6923A]/15 overflow-hidden"
          style={{ background: 'rgba(198,146,58,0.03)' }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C6923A]/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-[#C6923A]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Sample Operator Report Card</div>
                <div className="text-[10px] text-[#6b7280]">What carriers see before they dispatch</div>
              </div>
            </div>
            <Link
              aria-label="View demo report card"
              href="/demo-report-card"
              className="text-[10px] font-bold text-[#C6923A] uppercase tracking-wider hover:text-white transition-colors"
            >
              See Full Demo →
            </Link>
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Trust Score", value: "94/100", sub: "Top 5%", color: "#22c55e" },
              { label: "Jobs Completed", value: "347", sub: "Since 2023", color: "#3b82f6" },
              { label: "Incident-Free", value: "24 months", sub: "Consecutive", color: "#F59E0B" },
              { label: "Response Speed", value: "2.1 min", sub: "Avg accept time", color: "#a855f7" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg sm:text-xl font-black" style={{ color }}>{value}</div>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</div>
                <div className="text-[9px] text-[#6b7280]">{sub}</div>
              </div>
            ))}
          </div>

          {/* Verification badges */}
          <div className="px-4 sm:px-5 pb-4 flex flex-wrap items-center gap-2">
            {[
              { label: "Insurance Verified", color: "#22c55e" },
              { label: "CEVO Certified", color: "#3b82f6" },
              { label: "Background Checked", color: "#F59E0B" },
              { label: "GPS Tracked", color: "#a855f7" },
            ].map(({ label, color }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
                style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}>
                <CheckCircle className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Industry Partner Signals */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="mt-8 text-center"
        >
          <div className="text-[9px] font-bold text-[#4a5568] uppercase tracking-[0.2em] mb-4">
            Recognized By Industry Leaders
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PARTNER_LOGOS.map(({ name, label }) => (
              <div key={name} className="group cursor-default">
                <div className="text-sm font-black text-[#374151] group-hover:text-[#C6923A] transition-colors tracking-wider" title={label}>
                  {name}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
