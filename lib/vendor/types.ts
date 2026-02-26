// =========================================================
// lib/vendor/types.ts
// Shared TypeScript interfaces for vendor layer
// =========================================================

export interface VendorApplication {
    id: string;
    company_name: string;
    vendor_type: string;
    website_url: string | null;
    notes: string | null;
    primary_contact_name: string;
    primary_contact_phone: string;
    primary_contact_email: string | null;
    dispatch_phone: string;
    country: string;
    region1: string | null;
    city: string;
    postal_code: string | null;
    address_line1: string | null;
    lat: number | null;
    lng: number | null;
    is_24_7: boolean;
    service_radius_miles: number;
    services_json: unknown[];
    preferred_plan_tier: string;
    status: "pending" | "needs_info" | "approved" | "rejected";
    submitted_at: string;
    reviewed_at: string | null;
    reviewer_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Vendor {
    id: string;
    legal_name: string;
    dba_name: string | null;
    vendor_type: string;
    primary_contact_name: string | null;
    primary_contact_phone: string | null;
    dispatch_phone: string | null;
    website_url: string | null;
    description: string | null;
    status: "active" | "suspended" | "closed";
    verified_status: "unverified" | "pending" | "verified";
    application_id: string | null;
    // Trust
    trust_score: number;
    trust_tier: TrustTier;
    on_time_rate?: number;
    completion_rate?: number;
    response_time_avg_sec?: number;
    cancellation_count?: number;
    jobs_completed?: number;
    trust_factors_json?: unknown;
    corridor_experience_json?: unknown;

    // Equipment Compliance
    has_amber_beacon: boolean;
    has_oversize_signs: boolean;
    has_two_way_radio: boolean;
    radio_type: "CB" | "UHF" | "VHF" | "GMRS" | "multiple" | "none";
    has_height_pole: boolean;
    max_pole_height_inches?: number | null;
    equipment_compliance_score: number;

    created_at: string;
    updated_at: string;
}

export interface VendorService {
    id: string;
    vendor_id: string;
    service_category: string;
    service_name: string;
    service_code: string | null;
    is_active: boolean;
    rate_unit: "per_mile" | "flat" | "hourly" | "per_axle" | "quote";
    rate_amount: number | null;
    notes: string | null;
}

export interface PremiumPlacement {
    id: string;
    vendor_id: string;
    placement_type: "near_route" | "emergency_top" | "category_top" | "corridor_exclusive" | "push_eligible";
    region1: string | null;
    corridor_name: string | null;
    bid_monthly: number;
    is_exclusive: boolean;
    start_at: string;
    end_at: string;
    created_at: string;
    updated_at: string;
}

// ── Live Status (Competitive Dominance Pack) ──

export type LiveStatus = "available" | "on_job" | "en_route" | "off_duty";

export type TrustTier = "elite" | "preferred" | "standard" | "probation";

export interface VendorCertification {
    id: string;
    vendor_id: string;
    cert_type: string;
    cert_name: string;
    issuing_body: string | null;
    cert_number: string | null;
    issued_at: string | null;
    expires_at: string | null;
    is_verified: boolean;
    verified_at: string | null;
    verified_by: string | null;
    document_url: string | null;
    status: "active" | "expired" | "revoked" | "pending_review";
    notes: string | null;
    created_at: string;
    updated_at: string;
}
