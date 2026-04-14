"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Siren, Clock, Phone, MapPin,
  ArrowRight, CheckCircle, Radio,
} from "lucide-react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FLEET BACKUP & URGENT RESCUE SECTION
   â”€ ODS mentions "fleet backup" but doesn't surface it as
     a named product. HC turns it into a visible, urgent
     dispatching layer with specific SLAs.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function FleetBackupRescue() {
  return (
    <section className="relative z-10 py-10 sm:py-16">
      <div className="hc-container max-w-5xl">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl border border-red-500/15 overflow-hidden relative"
          style={{ background: 'rgba(239,68,68,0.03)' }}
        >
          {/* Pulsing urgency indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">24/7 Active</span>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: '#ef444412', border: '1px solid #ef444420' }}>
                <Siren className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-[0.15em]">Urgent Dispatch Layer</div>
                <h2 className="text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Fleet Backup & Rescue Coverage
                </h2>
              </div>
            </div>

            <p className="text-[#8fa3b8] text-xs sm:text-sm leading-relaxed mb-6 max-w-2xl">
              Escort no-shows. Last-minute cancellations. Emergency re-routes. When a move goes wrong, 
              our rescue dispatch layer activates in under 15 minutes — finding the nearest available, 
              qualified replacement from our 15,000+ operator network.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: Clock, label: "Response SLA", value: "< 15 min", desc: "Average rescue dispatch time" },
                { icon: MapPin, label: "Coverage", value: "120 Countries", desc: "Wherever your load is stranded" },
                { icon: Radio, label: "Availability", value: "24/7/365", desc: "No holidays, no downtime" },
              ].map(({ icon: Icon, label, value, desc }) => (
                <div key={label} className="text-center p-3 rounded-xl border border-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Icon className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
                  <div className="text-sm font-black text-white">{value}</div>
                  <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">{label}</div>
                  <div className="text-[9px] text-[#6b7280] mt-0.5">{desc}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                {[
                  "Automatic escalation when fill times exceed SLA",
                  "Rate surge option to attract nearby operators fast",
                  "Backup fleet of asset-based vehicles in high-demand corridors",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-[#b0bac9]">
                    <CheckCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                aria-label="Request emergency escort"
                href="/emergency"
                className="inline-flex items-center gap-2 text-xs font-bold text-white px-5 py-3 rounded-xl transition-all flex-shrink-0 press-scale"
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                }}
              >
                <Phone className="w-3.5 h-3.5" /> Request Emergency Escort <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}