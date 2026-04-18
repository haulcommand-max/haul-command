"use client";

import { useCallback } from "react";

/**
 * QuickPay analytics event names as specified in execution spec.
 * Maps to PostHog/analytics when available, falls back to console in dev.
 */
type QuickPayEvent =
  | "quickpay_cta_view"
  | "quickpay_cta_click"
  | "quickpay_fee_preview_loaded"
  | "quickpay_submission_started"
  | "quickpay_submission_succeeded"
  | "quickpay_submission_failed";

interface QuickPayTrackingProps {
  invoiceId?: string;
  surface: string;
  amount?: number;
}

function captureEvent(
  event: QuickPayEvent,
  properties: Record<string, unknown>,
) {
  // PostHog capture if available
  if (typeof window !== "undefined" && (window as any).posthog?.capture) {
    (window as any).posthog.capture(event, properties);
    return;
  }

  // Dev fallback
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[QuickPay Track] ${event}`,
      JSON.stringify(properties, null, 2),
    );
  }
}

/**
 * Hook that returns strongly-typed tracking functions for QuickPay metrics.
 * Fires events via PostHog when loaded, falls back to console in dev.
 *
 * Usage:
 *   const track = useQuickPayTracking({ surface: "invoice_detail", invoiceId: "123" });
 *   track.ctaView();
 *   track.ctaClick();
 *   track.feePreviewLoaded(5000, 150, 4850);
 *   track.submissionStarted();
 *   track.submissionSucceeded("req_abc123");
 *   track.submissionFailed("Escrow not funded");
 */
export function useQuickPayTracking({
  invoiceId,
  surface,
  amount,
}: QuickPayTrackingProps) {
  const base = { invoice_id: invoiceId, surface, amount };

  const ctaView = useCallback(
    () => captureEvent("quickpay_cta_view", base),
    [invoiceId, surface, amount],
  );

  const ctaClick = useCallback(
    () => captureEvent("quickpay_cta_click", base),
    [invoiceId, surface, amount],
  );

  const feePreviewLoaded = useCallback(
    (grossAmount: number, feeAmount: number, netToday: number) =>
      captureEvent("quickpay_fee_preview_loaded", {
        ...base,
        gross_amount: grossAmount,
        fee_amount: feeAmount,
        net_today: netToday,
      }),
    [invoiceId, surface, amount],
  );

  const submissionStarted = useCallback(
    () => captureEvent("quickpay_submission_started", base),
    [invoiceId, surface, amount],
  );

  const submissionSucceeded = useCallback(
    (requestId: string) =>
      captureEvent("quickpay_submission_succeeded", {
        ...base,
        request_id: requestId,
      }),
    [invoiceId, surface, amount],
  );

  const submissionFailed = useCallback(
    (reason: string) =>
      captureEvent("quickpay_submission_failed", {
        ...base,
        failure_reason: reason,
      }),
    [invoiceId, surface, amount],
  );

  return {
    ctaView,
    ctaClick,
    feePreviewLoaded,
    submissionStarted,
    submissionSucceeded,
    submissionFailed,
  };
}
