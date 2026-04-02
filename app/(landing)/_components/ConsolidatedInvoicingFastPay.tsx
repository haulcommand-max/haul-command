"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard, FileText, Zap, Receipt,
  ArrowRight, CheckCircle, Globe,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CONSOLIDATED INVOICING & FAST PAY SECTION
   ─ Directly absorbs ODS's strongest operational promise
     (consolidated invoicing) and their operator fast-pay
     hook, then upgrades both with platform-native features.
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function ConsolidatedInvoicingFastPay() {
  return (
    <section className="relative z-10 py-10 sm:py-16">
      <div className="hc-container max-w-5xl">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Consolidated Invoicing — Carrier Side */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl border border-[#a855f7]/15 overflow-hidden"
            style={{ background: 'rgba(168,85,247,0.03)' }}
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#a855f712', border: '1px solid #a855f720' }}>
                  <Receipt className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.15em]">For Carriers</div>
                  <div className="text-base font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    Consolidated Invoicing
                  </div>
                </div>
              </div>

              <p className="text-[#8fa3b8] text-xs sm:text-sm leading-relaxed mb-5">
                One invoice per project. Multi-escort, multi-state, multi-day moves — 
                all consolidated into a single, clean billing document. No more managing 
                15 different escort invoices for one load.
              </p>

              <div className="space-y-2 mb-5">
                {[
                  "Single invoice per project, regardless of escort count",
                  "Automatic reconciliation across states and jurisdictions",
                  "Export to QuickBooks, SAP, and all major accounting systems",
                  "Net-30, Net-15, or instant payment options",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-[#b0bac9]">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/services/consolidated-invoicing"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-[0.15em] hover:text-white transition-colors"
              >
                Learn More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>

          {/* Fast Pay — Operator Side */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            custom={1} variants={fadeUp}
            className="rounded-2xl border border-emerald-500/15 overflow-hidden"
            style={{ background: 'rgba(34,197,94,0.03)' }}
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#22c55e12', border: '1px solid #22c55e20' }}>
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em]">For Operators</div>
                  <div className="text-base font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    Same-Day & Instant Pay
                  </div>
                </div>
              </div>

              <p className="text-[#8fa3b8] text-xs sm:text-sm leading-relaxed mb-5">
                Complete the job, confirm delivery, get paid. Same day payout to your bank account, 
                or instant payout through Stripe. No invoicing required — the platform handles everything.
              </p>

              <div className="space-y-2 mb-5">
                {[
                  "Same-day direct deposit standard on all jobs",
                  "Instant payout option (funds in minutes, not days)",
                  "Escrow-protected — your money is never at risk",
                  "No paperwork, no invoicing — automatic settlement",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-[#b0bac9]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/quickpay"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em] hover:text-white transition-colors"
              >
                Learn More <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
