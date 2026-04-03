// lib/ads/recruiter-types.ts
// Canonical RecruiterOffer type — shared between AdGridRecruiterCard
// and the recruiter registry.

export interface RecruiterOffer {
    id: string;
    carrier_name: string;
    carrier_logo: string | null;
    pitch: string;
    pay_range: string;
    region: string;
    requirements: string[];
    perks: string[];
    trust_score_min: number;
    apply_url: string;
    urgent: boolean;
    load_types: string[];
    tier: 'house' | 'paid' | 'partner';
}
