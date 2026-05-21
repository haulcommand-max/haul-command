'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Map, Users } from 'lucide-react';

export default function SocialProofBanner() {
  return (
    <section className="relative w-full py-12 sm:py-20 border-y border-white/[0.04] bg-[#0b0c10] overflow-hidden">
      {/* Ambient background lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C6923A] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.06),transparent_70%)]" />
      </div>

      <div className="hc-container max-w-5xl relative z-10">
        
        {/* Source-gated proof strip: no hardcoded counts */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-16 mb-16 sm:mb-24">
          {[
            { label: 'Directory Signals', value: 'Source-backed', icon: Users },
            { label: 'Market Coverage', value: 'Verified by source', icon: Map },
            { label: 'Trust Claims', value: 'Evidence-gated', icon: ShieldCheck },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-[#C6923A]" />
                <div className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "var(--font-mono, monospace)" }}>
                  {stat.value}
                </div>
              </div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#8fa3b8]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* TRUST BLOCK */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16 sm:mb-24 relative"
        >
          <blockquote className="text-xl sm:text-3xl font-medium leading-[1.4] text-white mb-8 sm:mb-10 px-4" style={{ fontFamily: "var(--font-display, sans-serif)", letterSpacing: "-0.01em" }}>
            Haul Command public proof surfaces should show claim state, submitted evidence, source confidence, and freshness only where verified data exists.
          </blockquote>
        </motion.div>

        {/* GOVERNANCE NOTE */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.25em] mb-8">
            Evidence before claims
          </div>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[#8fa3b8]">
            Counts, partner badges, availability, and coverage claims are displayed only when backed by approved source records.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
