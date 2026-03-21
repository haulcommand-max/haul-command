/**
 * QuickPay Types — Shared between API routes and UI components
 */

export type QuickPayStatus =
    | 'pending'
    | 'risk_review'
    | 'approved'
    | 'transferring'
    | 'completed'
    | 'failed'
    | 'reversed'
    | 'cancelled';

export interface QuickPayTransaction {
    id: string;
    operator_id: string;
    broker_id: string;
    booking_id: string | null;

    gross_amount_cents: number;
    fee_amount_cents: number;
    net_payout_cents: number;
    fee_percentage: number;
    currency: string;

    stripe_transfer_id: string | null;
    stripe_payout_id: string | null;
    stripe_connect_account: string | null;
    stripe_charge_id: string | null;

    status: QuickPayStatus;

    risk_score: number;
    risk_flags: string[];
    broker_payment_history_ok: boolean;
    broker_dispute_count: number;

    requested_at: string;
    approved_at: string | null;
    transferred_at: string | null;
    completed_at: string | null;
    failed_at: string | null;
    failure_reason: string | null;

    created_at: string;
    updated_at: string;
}

export interface QuickPayRiskAssessment {
    risk_score: number;
    risk_flags: string[];
    approved: boolean;
    dispute_count: number;
    broker_history_count: number;
    max_allowed_cents: number;
}

export interface QuickPayRequest {
    booking_id: string;
    broker_id: string;
    gross_amount_cents: number;
    currency?: string;
}

export interface QuickPayResponse {
    status: 'success';
    transaction_id: string;
    gross_amount: number;
    fee_amount: number;
    fee_percentage: number;
    net_payout: number;
    currency: string;
    payout_method: 'instant' | 'standard';
    payout_eta: string;
    stripe_transfer_id: string;
    stripe_payout_id: string | null;
}

export interface QuickPayHistorySummary {
    total_quickpays: number;
    total_paid_out: number;
    total_fees_paid: number;
    average_fee_pct: number;
}

// Fee configuration
export const QUICKPAY_CONFIG = {
    FEE_PERCENTAGE: 2.50,
    MAX_AMOUNT_CENTS: 1_000_000, // $10,000
    MIN_AMOUNT_CENTS: 500,        // $5.00
    RISK_THRESHOLD: 0.50,         // Score above this = decline
} as const;
