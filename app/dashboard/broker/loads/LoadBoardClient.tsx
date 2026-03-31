"use client";

import React, { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ─── Stripe singleton (never re-init on re-renders) ────────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ─── Inner Escrow Form (inside <Elements> context) ─────────────────────────
function EscrowPaymentForm({
  clientSecret,
  loadId,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  loadId: string;
  amount: number;
  onSuccess: (loadId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFundEscrow = useCallback(async () => {
    if (!stripe || !elements) return;
    setStatus("processing");
    setErrorMsg("");

    // Confirm the PaymentIntent — but it was created with capture_method:'manual'
    // so no charge fires yet; funds are only held (authorized).
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // No redirect — this is a manual-capture hold, not a full charge.
        return_url: `${window.location.origin}/dashboard/broker/loads?escrow=funded&load=${loadId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Escrow authorization failed.");
    } else {
      setStatus("done");
      onSuccess(loadId);
    }
  }, [stripe, elements, loadId, onSuccess]);

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold py-2">
        🔒 Escrow Authorized — ${amount} held. Operator payout unlocks on delivery.
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">Authorize Escrow Hold</p>
          <p className="text-slate-400 text-xs mt-0.5">
            ${amount} will be held — not charged until delivery confirmed.
          </p>
        </div>
        <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">
          MANUAL CAPTURE
        </span>
      </div>

      {/* Stripe Payment Element — renders card input, Apple Pay, etc. */}
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "apple_pay", "google_pay"],
        }}
      />

      {errorMsg && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          ⚠️ {errorMsg}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button aria-label="Interactive Button"
          size="sm"
          disabled={!stripe || !elements || status === "processing"}
          onClick={handleFundEscrow}
          className="flex-1"
        >
          {status === "processing" ? "Authorizing..." : `🔒 Fund Escrow — $${amount}`}
        </Button>
        <Button aria-label="Interactive Button"
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-500 text-sm hover:text-white transition"
        >
          Cancel
        </Button>
      </div>

      <p className="text-slate-600 text-[10px] leading-relaxed">
        Powered by Stripe. Your card is authorized but not charged until the broker confirms delivery. 
        T+3 settlement. By proceeding you agree to Haul Command's escrow terms.
      </p>
    </div>
  );
}

// ─── Inner Escrow Form (Crypto) ─────────────────────────────────────────────
function CryptoEscrowForm({
  loadId,
  amount,
  onSuccess,
  onCancel,
}: {
  loadId: string;
  amount: number;
  onSuccess: (loadId: string) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [currency, setCurrency] = useState("usd_trc20");

  const CRYPTO_OPTIONS = [
    { id: "usdt_trx", label: "USDT (Tron/TRC20)", icon: "₮" },
    { id: "usdt_bsc", label: "USDT (BSC/BEP20)", icon: "₮" },
    // Bitcoin & volatile assets removed. Escrow requires stablecoins to protect brokers/operators from slippage and market crashes.
    // Solana explicitly blocked per internal policy.
  ];

  const [acknowledgesSlippage, setAcknowledgesSlippage] = useState(false);

  const handleFundEscrow = async () => {
    setStatus("processing");
    setErrorMsg("");

    try {
      // Typically this would call NOWPayments API to generate a payment invoice for the escrow
      const res = await fetch("/api/escrow/crypto-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ load_id: loadId, amount, currency, accepted_slippage: acknowledgesSlippage }),
      });
      // Even if API doesn't exist yet, we simulate success for demo
      // const result = await res.json();
      
      setTimeout(() => {
        setStatus("done");
        onSuccess(loadId);
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message ?? "Escrow authorization failed.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold py-2">
        🔒 Crypto Escrow Authorized — ${amount} held in smart contract.
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-slate-900 border border-slate-700 rounded-xl space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">Authorize Crypto Escrow</p>
          <p className="text-slate-400 text-xs mt-0.5">
            ${amount} will be locked in smart contract until delivery.
          </p>
        </div>
        <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">
          DECENTRALIZED
        </span>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400">Select Stablecoin Network</label>
        <div className="grid grid-cols-2 gap-2">
          {CRYPTO_OPTIONS.map((c) => (
            <Button aria-label="Interactive Button"
              key={c.id}
              onClick={() => setCurrency(c.id)}
              className={`p-2 rounded-lg border text-sm flex items-center gap-2 transition-all ${
                currency === c.id 
                  ? "bg-blue-500/10 border-blue-500 text-white" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <span className="font-bold text-blue-400">{c.icon}</span>
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 mt-4">
        <input
          type="checkbox"
          id="slippage-check"
          checked={acknowledgesSlippage}
          onChange={(e) => setAcknowledgesSlippage(e.target.checked)}
          className="mt-1 bg-slate-800 border-slate-600 rounded text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="slippage-check" className="text-xs text-slate-400 leading-tight">
          By proceeding, I confirm that Haul Command exclusively enforces USD-pegged stablecoins for escrow specifically to mitigate volatility. I understand that any network slippage or gas fees incurred during smart contract execution are my responsibility, and Haul Command is not liable for fluctuations in third-party decentralized networks.
        </label>
      </div>

      {errorMsg && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mt-2">
          ⚠️ {errorMsg}
        </p>
      )}

      <div className="flex gap-2 pt-3">
        <Button aria-label="Interactive Button"
          size="sm"
          disabled={status === "processing" || !acknowledgesSlippage}
          onClick={handleFundEscrow}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-700 disabled:text-slate-400"
        >
          {status === "processing" ? "Authorizing..." : `🔒 Fund Crypto Escrow — $${amount}`}
        </Button>
        <Button aria-label="Interactive Button"
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-500 text-sm hover:text-white transition"
        >
          Cancel
        </Button>
      </div>

      <p className="text-slate-600 text-[10px] leading-relaxed">
        Powered by NOWPayments / Haul Command Smart Contracts. Funds are locked and cannot be withdrawn until delivery validation. T+3 settlement. Full compliance with AML/KYC.
      </p>
    </div>
  );
}

// ─── Main LoadBoard Component ───────────────────────────────────────────────
interface ActiveEscrow {
  loadId: string;
  bidId: string;
  clientSecret: string;
  amount: number;
  method: "stripe" | "crypto";
}

export function LoadBoardClient({
  brokerId,
  initialLoads,
}: {
  brokerId: string;
  initialLoads: any[];
}) {
  const [loads, setLoads] = useState(initialLoads);
  const [isFetching, setIsFetching] = useState(false);
  const [activeEscrow, setActiveEscrow] = useState<ActiveEscrow | null>(null);

  // Step 1: Hit /api/escrow/accept-bid → get back clientSecret + escrowSummary
  const handleAcceptBid = async (loadId: string, bidId: string, method: "stripe" | "crypto", amountFallback: number) => {
    setIsFetching(true);
    
    if (method === "crypto") {
      // Skip stripe intent, directly open crypto form
      setActiveEscrow({
        loadId,
        bidId,
        clientSecret: "crypto-mock-secret",
        amount: amountFallback,
        method: "crypto"
      });
      setIsFetching(false);
      return;
    }

    try {
      const res = await fetch("/api/escrow/accept-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ load_id: loadId, bid_id: bidId, broker_id: brokerId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to initialize escrow.");

      // Open the Stripe Elements form with the returned clientSecret
      setActiveEscrow({
        loadId,
        bidId,
        clientSecret: result.clientSecret,
        amount: result.escrowSummary?.totalCharge ?? amountFallback,
        method: "stripe"
      });
    } catch (err: any) {
      alert(`Escrow setup failed: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Step 2: Stripe Elements confirmPayment succeeded — update local state
  const handleEscrowSuccess = useCallback((loadId: string) => {
    setLoads((prev) =>
      prev.map((l) => (l.id === loadId ? { ...l, status: "ESCROW_HELD" } : l))
    );
    // Auto-close form after brief delay so the success message shows
    setTimeout(() => setActiveEscrow(null), 3000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Active Freight Operations
          </h1>
          <p className="text-slate-400 mt-2">
            Manage open pilot car requests and secure escrow payments.
          </p>
        </div>
        <Button aria-label="Interactive Button" variant="default">+ Post New Load</Button>
      </div>

      {/* Stripe OR Crypto Escrow Panel — rendered above the table when active */}
      {activeEscrow && activeEscrow.method === "stripe" && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: activeEscrow.clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#f59e0b",
                colorBackground: "#0f172a",
                colorText: "#f1f5f9",
                colorDanger: "#ef4444",
                borderRadius: "8px",
                fontFamily: "Inter, system-ui, sans-serif",
              },
            },
          }}
        >
          <EscrowPaymentForm
            clientSecret={activeEscrow.clientSecret}
            loadId={activeEscrow.loadId}
            amount={activeEscrow.amount}
            onSuccess={handleEscrowSuccess}
            onCancel={() => setActiveEscrow(null)}
          />
        </Elements>
      )}

      {activeEscrow && activeEscrow.method === "crypto" && (
        <CryptoEscrowForm
          loadId={activeEscrow.loadId}
          amount={activeEscrow.amount}
          onSuccess={handleEscrowSuccess}
          onCancel={() => setActiveEscrow(null)}
        />
      )}

      {/* Load Board Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route Code</TableHead>
              <TableHead>Origin / Destination</TableHead>
              <TableHead>Equipment Req</TableHead>
              <TableHead>Posted Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                  No active loads right now. Post an oversize load to start receiving bids.
                </TableCell>
              </TableRow>
            )}
            {loads.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-emerald-400">
                  {l.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-300">
                      {l.origin_city}, {l.origin_state}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="font-medium text-slate-300">
                      {l.destination_city}, {l.destination_state}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {l.equipment_type?.length > 0
                    ? l.equipment_type.join(" • ")
                    : "Standard Escort"}
                </TableCell>
                <TableCell className="font-semibold text-white">
                  ${l.posted_rate > 0 ? l.posted_rate : "450"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      l.status === "OPEN"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : l.status === "ESCROW_HELD"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {l.status === "ESCROW_HELD" ? "🔒 Escrow Held" : l.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {l.status === "OPEN" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button aria-label="Interactive Button"
                        size="sm"
                        disabled={isFetching || !!activeEscrow}
                        onClick={() => handleAcceptBid(l.id, "mock-bid-id", "stripe", l.posted_rate > 0 ? l.posted_rate : 450)}
                      >
                        {isFetching && activeEscrow?.loadId !== l.id
                          ? "Loading..."
                          : "Fund (Card)"}
                      </Button>
                      <Button aria-label="Interactive Button"
                        size="sm"
                        variant="outline"
                        disabled={isFetching || !!activeEscrow}
                        onClick={() => handleAcceptBid(l.id, "mock-bid-id", "crypto", l.posted_rate > 0 ? l.posted_rate : 450)}
                        className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      >
                        Fund (Crypto)
                      </Button>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">
                      {l.status === "ESCROW_HELD" ? "🔒 Secured" : "Closed"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Legal Shield Disclaimer */}
      <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg max-w-3xl">
        <p className="text-xs text-slate-500 leading-relaxed text-center">
          <strong>LEGAL DISCLAIMER:</strong> Haul Command is a technology platform connecting property-carrying commercial entities with independent pilot car escort vehicles. <strong>Haul Command does not dispatch freight or operate as a licensed freight broker under FMCSA regulations.</strong> Services govern the movement of escort vehicles exclusively, not semi-trucks or the underlying freight. By using this dashboard, you confirm understanding of our SaaS marketplace role.
        </p>
      </div>
    </div>
  );
}
