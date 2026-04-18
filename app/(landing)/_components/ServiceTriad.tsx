"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Truck, Search, Radio,
} from "lucide-react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SERVICE TRIAD — Plan a Load / Find Escorts / Share Availability
   â”€ Mirrors ODS's "Order a Pilot Car / Share Your Availability"
     dual CTA but adds a 3rd surface (Plan a Load) to capture
     more intent and create a self-serve loop.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const TRIAD = [
  {
    icon: Truck,
    title: "Plan a Load",
    desc: "Enter dimensions, route, and date. Our engine checks escort requirements, permit rules, and bridge clearances for every state on the path.",
    href: "/loads",
    cta: "Start Planning",
    accent: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  },
  {
    icon: Search,
    title: "Find Escorts",
    desc: "Search 15,000+ verified pilot car operators across 120 countries. Filter by location, equipment, certification, rating, and availability.",
    href: "/directory",
    cta: "Search Directory",
    accent: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
  {
    icon: Radio,
    title: "Share Availability",
    desc: "Toggle available, set your territory, and receive instant push offers matched to your equipment. Get paid same day.",
    href: "/onboarding/start?role=operator",
    cta: "Go Available",
    accent: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  },
];

export function ServiceTriad() {
  return (
    <section className="relative z-10 py-10 sm:py-16">
      <div className="hc-container max-w-5xl">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-6 sm:mb-10"
        >
          <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-2">
            Get Started in 60 Seconds
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Three Ways In. One Command Center.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {TRIAD.map(({ icon: Icon, title, desc, href, cta, accent, gradient }, i) => (
            <motion.div
              key={title}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              custom={i} variants={fadeUp}
            >
              <Link
                aria-label={cta}
                href={href}
                className="group block relative rounded-2xl border overflow-hidden h-full"
                style={{
                  borderColor: `${accent}18`,
                  background: `${accent}04`,
                  transition: 'border-color 0.3s, transform 0.25s, box-shadow 0.3s',
                }}
              >
                {/* Top accent bar */}
                <div className="h-1 w-full" style={{ background: gradient }} />

                <div className="p-5 sm:p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
                    <Icon className="w-6 h-6" style={{ color: accent }} />
                  </div>

                  <h3 className="text-lg font-black text-white mb-2 group-hover:text-[#C6923A] transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}>
                    {title}
                  </h3>

                  <p className="text-[#8fa3b8] text-xs sm:text-sm leading-relaxed mb-5">
                    {desc}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-[0.1em] group-hover:gap-3 transition-all"
                    style={{ color: accent }}>
                    {cta} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}