/**
 * lib/posthog.ts
 * PostHog analytics events — thin wrapper for QuickPay and other product events.
 * Falls back to no-op if PostHog is not initialized.
 */

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && (window as any).posthog?.capture) {
      (window as any).posthog.capture(event, properties);
    }
  } catch {
    // Silently fail — analytics must never break the app
  }
}

export const QuickPayEvents = {
  ctaViewed: (props: { job_id: string; amount: number }) =>
    safeCapture('quickpay_cta_viewed', props),

  ctaClicked: (props: { job_id: string; amount: number; source: string }) =>
    safeCapture('quickpay_cta_clicked', props),

  advanceSuccess: (props: { job_id: string; amount: number; advance_id: string }) =>
    safeCapture('quickpay_advance_success', props),

  advanceFailed: (props: { job_id: string; amount: number; error: string }) =>
    safeCapture('quickpay_advance_failed', props),
};
