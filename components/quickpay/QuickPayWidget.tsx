"use client";

import { useState, useEffect } from "react";
import { Zap, DollarSign, Clock, AlertCircle, CheckCircle2, X, ChevronRight } from "lucide-react";
import { QuickPayEvents } from "@/lib/posthog";

export type QuickPayEligibility =
  | "eligible"
  | "ineligible"
  | "review_required"
  | "submitted"
  | "funded"
  | "error";

interface QuickPayWidgetProps {
  /** The job or assignment ID used as the invoice reference */
  jobId: string;
  /** Gross invoice amount in dollars */
  grossAmount: number;
  /** Optional override for eligibility — if not provided, component derives it */
  eligibilityStatus?: QuickPayEligibility;
  /** Plain-language reason when ineligible */
  holdReason?: string;
  /** Whether already paid — hides widget entirely */
  isPaid?: boolean;
  /** Compact mode for list rows */
  compact?: boolean;
}

const FEE_RATE = 0.03;

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function QuickPayWidget({
  jobId,
  grossAmount,
  eligibilityStatus: initialStatus = "eligible",
  holdReason,
  isPaid = false,
  compact = false,
}: QuickPayWidgetProps) {
  const [status, setStatus] = useState<QuickPayEligibility>(initialStatus);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fee = Math.round(grossAmount * FEE_RATE * 100) / 100;
  const netToday = Math.round((grossAmount - fee) * 100) / 100;

  useEffect(() => {
    if (initialStatus === "eligible") {
      QuickPayEvents.ctaViewed({ job_id: jobId, amount: grossAmount });
    }
  }, [jobId, grossAmount, initialStatus]);

  // Do not render if invoice is already paid
  if (isPaid || grossAmount <= 0) return null;


  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/quickpay/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, invoice_amount: grossAmount }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setStatus("submitted");
        setShowConfirm(false);
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error || "Submission failed. Please try again.");
        setStatus("error");
        setShowConfirm(false);
        return;
      }

      setRequestId(data.advance_id ?? data.id ?? jobId);
      setStatus("funded");
      setShowConfirm(false);
      QuickPayEvents.advanceSuccess({ job_id: jobId, amount: grossAmount, advance_id: data.advance_id ?? data.id ?? jobId });
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "funded") {
    return (
      <div className="rounded-lg border border-green-600/30 bg-green-950/30 p-3 flex items-start gap-3">
        <CheckCircle2 className="text-green-400 mt-0.5 shrink-0" size={18} />
        <div>
          <p className="text-sm font-semibold text-green-300">
            {fmt(netToday)} advancing to your account
          </p>
          <p className="text-xs text-green-400/70 mt-0.5">
            Expected within 1–2 business days · Request ID: {requestId}
          </p>
        </div>
      </div>
    );
  }

  // ── Submitted/pending state ────────────────────────────────────────────────
  if (status === "submitted") {
    return (
      <div className="rounded-lg border border-yellow-600/30 bg-yellow-950/20 p-3 flex items-start gap-3">
        <Clock className="text-yellow-400 mt-0.5 shrink-0" size={18} />
        <div>
          <p className="text-sm font-semibold text-yellow-300">QuickPay under review</p>
          <p className="text-xs text-yellow-400/70 mt-0.5">
            We'll notify you once funds are confirmed.
          </p>
        </div>
      </div>
    );
  }

  // ── Ineligible state ───────────────────────────────────────────────────────
  if (status === "ineligible") {
    return (
      <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/40 p-3 flex items-start gap-3">
        <AlertCircle className="text-zinc-400 mt-0.5 shrink-0" size={16} />
        <div>
          <p className="text-xs text-zinc-400 font-medium">QuickPay not available</p>
          {holdReason && (
            <p className="text-xs text-zinc-500 mt-0.5">{holdReason}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="rounded-lg border border-red-600/30 bg-red-950/20 p-3 flex items-start gap-3">
        <X className="text-red-400 mt-0.5 shrink-0" size={16} />
        <div>
          <p className="text-xs text-red-300 font-medium">QuickPay failed</p>
          <p className="text-xs text-red-400/70 mt-0.5">{errorMsg}</p>
          <button
            onClick={() => setStatus("eligible")}
            className="text-xs text-red-300 underline mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Confirm modal ─────────────────────────────────────────────────────────
  if (showConfirm) {
    return (
      <div className="rounded-lg border border-yellow-500/40 bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Confirm QuickPay Advance</p>
          <button onClick={() => setShowConfirm(false)} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="text-xs space-y-1.5 text-zinc-300">
          <div className="flex justify-between">
            <span>Invoice amount</span>
            <span className="font-mono">{fmt(grossAmount)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>3% advance fee</span>
            <span className="font-mono">− {fmt(fee)}</span>
          </div>
          <div className="flex justify-between text-green-300 font-semibold border-t border-zinc-700 pt-1.5">
            <span>You receive today</span>
            <span className="font-mono">{fmt(netToday)}</span>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition disabled:opacity-50"
        >
          {loading ? "Processing…" : `Advance ${fmt(netToday)} Now`}
        </button>
        <p className="text-[10px] text-zinc-500 text-center">
          Funds typically arrive within 1–2 business days via Stripe.
        </p>
      </div>
    );
  }

  // ── Compact row CTA ────────────────────────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={() => {
          QuickPayEvents.ctaClicked({ job_id: jobId, amount: grossAmount, source: "compact" });
          setShowConfirm(true);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition"
        data-event="quickpay_cta_click"
      >
        <Zap size={12} />
        Advance
      </button>
    );
  }

  // ── Full CTA card ──────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-4 space-y-3"
      data-event="quickpay_cta_view"
    >
      <div className="flex items-center gap-2">
        <Zap className="text-yellow-400" size={18} />
        <p className="text-sm font-bold text-white">Get Paid Today</p>
      </div>

      {/* Fee preview */}
      <div className="text-xs space-y-1 text-zinc-300">
        <div className="flex justify-between">
          <span>Invoice amount</span>
          <span className="font-mono text-white">{fmt(grossAmount)}</span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>3% advance fee</span>
          <span className="font-mono">− {fmt(fee)}</span>
        </div>
        <div className="flex justify-between text-green-300 font-semibold border-t border-zinc-700/60 pt-1.5">
          <span>You receive today</span>
          <span className="font-mono">{fmt(netToday)}</span>
        </div>
      </div>

      <button
        onClick={() => {
          QuickPayEvents.ctaClicked({ job_id: jobId, amount: grossAmount, source: "full" });
          setShowConfirm(true);
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition"
        data-event="quickpay_cta_click"
      >
        <DollarSign size={15} />
        Get Paid Today
        <ChevronRight size={14} />
      </button>
      <p className="text-[10px] text-zinc-500 text-center">
        See fee and net payout · No waiting on broker payment
      </p>
    </div>
  );
}

/**
 * Dashboard summary card — show only when eligible invoices exist
 */
export function QuickPayDashboardCard({
  eligibleCount,
  totalEligibleAmount,
}: {
  eligibleCount: number;
  totalEligibleAmount: number;
}) {
  if (eligibleCount === 0) return null;

  const netApprox = Math.round(totalEligibleAmount * 0.97 * 100) / 100;

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-yellow-500/10">
          <Zap className="text-yellow-400" size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Unlock Cash Flow</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {eligibleCount} eligible invoice{eligibleCount > 1 ? "s" : ""} · ~{fmt(netApprox)} available today
          </p>
        </div>
      </div>
      <a
        href="/quickpay"
        className="shrink-0 px-3 py-1.5 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition"
      >
        View Options
      </a>
    </div>
  );
}
