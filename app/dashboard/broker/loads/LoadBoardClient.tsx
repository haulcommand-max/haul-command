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
        <Button
          size="sm"
          disabled={!stripe || !elements || status === "processing"}
          onClick={handleFundEscrow}
          className="flex-1"
        >
          {status === "processing" ? "Authorizing..." : `🔒 Fund Escrow — $${amount}`}
        </Button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-500 text-sm hover:text-white transition"
        >
          Cancel
        </button>
      </div>

      <p className="text-slate-600 text-[10px] leading-relaxed">
        Powered by Stripe. Your card is authorized but not charged until the broker confirms delivery. 
        T+3 settlement. By proceeding you agree to Haul Command's escrow terms.
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
  const handleAcceptBid = async (loadId: string, bidId: string) => {
    setIsFetching(true);
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
        amount: result.escrowSummary?.totalCharge ?? 0,
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
        <Button variant="default">+ Post New Load</Button>
      </div>

      {/* Stripe Escrow Panel — rendered above the table when active */}
      {activeEscrow && (
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
                    <Button
                      size="sm"
                      disabled={isFetching || !!activeEscrow}
                      onClick={() => handleAcceptBid(l.id, "mock-bid-id")}
                    >
                      {isFetching && activeEscrow?.loadId !== l.id
                        ? "Loading..."
                        : "Accept & Fund Escrow"}
                    </Button>
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
    </div>
  );
}
